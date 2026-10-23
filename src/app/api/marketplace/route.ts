import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'
import { ServiceRequestStatus } from '@prisma/client'

function sessionFrom(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  return token ? getSession(token) : null
}

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status })
}

export async function GET(req: NextRequest) {
  const session = sessionFrom(req)
  if (!session) return jsonError('Connexion requise', 401)
  const { searchParams } = new URL(req.url)
  const kind = searchParams.get('kind') || 'requests'

  if (kind === 'payments') {
    const payments = await db.payment.findMany({
      where: session.role === 'ADMIN' ? {} : { OR: [{ payerId: session.userId }, { beneficiaryId: session.userId }] },
      include: { contract: { include: { request: true } }, escrow: true, releases: true },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ payments })
  }
  if (kind === 'mine') {
    const requests = await db.serviceRequest.findMany({
      where: session.role === 'ADMIN' ? {} : { OR: [{ clientId: session.userId }, { providerId: session.userId }] },
      include: { quotes: true, contract: { include: { milestones: true, escrowTransactions: true } } },
      orderBy: { updatedAt: 'desc' },
    })
    return NextResponse.json({ requests })
  }
  const requests = await db.serviceRequest.findMany({
    where: { status: { in: [ServiceRequestStatus.PUBLISHED, ServiceRequestStatus.QUOTE_SENT] }, ...(session.role === 'PRESTATAIRE' ? { providerId: null } : {}) },
    include: { client: { select: { id: true, phone: true, clientProfile: true } }, quotes: true },
    orderBy: [{ urgent: 'desc' }, { createdAt: 'desc' }], take: 50,
  })
  return NextResponse.json({ requests })
}

export async function POST(req: NextRequest) {
  const session = sessionFrom(req)
  if (!session) return jsonError('Connexion requise', 401)
  const body = await req.json().catch(() => ({}))
  const idempotencyKey = String(body.idempotencyKey || '').trim()
  if (!idempotencyKey) return jsonError('Identifiant d’opération requis')

  if (body.action === 'request') {
    if (session.role !== 'CLIENT' && session.role !== 'ENTREPRISE') return jsonError('Seuls les clients et entreprises peuvent publier une demande', 403)
    if (!body.title || !body.description || !body.service) return jsonError('Titre, service et description requis')
    const existing = await db.serviceRequest.findUnique({ where: { idempotencyKey } })
    if (existing) return NextResponse.json({ request: existing, duplicate: true })
    const request = await db.serviceRequest.create({ data: {
      clientId: session.userId, title: body.title, description: body.description, service: body.service,
      province: body.province || null, district: body.district || null, commune: body.commune || null,
      budgetMin: body.budgetMin ?? null, budgetMax: body.budgetMax ?? null,
      scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : null, urgent: Boolean(body.urgent),
      status: body.publish === false ? ServiceRequestStatus.DRAFT : ServiceRequestStatus.PUBLISHED, idempotencyKey,
    } })
    return NextResponse.json({ request }, { status: 201 })
  }

  if (body.action === 'quote') {
    if (session.role !== 'PRESTATAIRE') return jsonError('Seuls les prestataires peuvent proposer un devis', 403)
    if (!body.requestId || body.amount == null) return jsonError('Demande et montant requis')
    const existing = await db.quote.findUnique({ where: { idempotencyKey } })
    if (existing) return NextResponse.json({ quote: existing, duplicate: true })
    const quote = await db.quote.create({ data: { requestId: body.requestId, providerId: session.userId, amount: body.amount, currency: body.currency || 'CDF', message: body.message || null, idempotencyKey } })
    await db.serviceRequest.update({ where: { id: body.requestId }, data: { status: ServiceRequestStatus.QUOTE_SENT } })
    return NextResponse.json({ quote }, { status: 201 })
  }

  if (body.action === 'payment') {
    if (body.amount == null) return jsonError('Montant requis')
    const existing = await db.payment.findUnique({ where: { idempotencyKey } })
    if (existing) return NextResponse.json({ payment: existing, duplicate: true })
    const payment = await db.payment.create({ data: {
      contractId: body.contractId || null, payerId: session.userId, beneficiaryId: body.beneficiaryId || null,
      amount: body.amount, fee: body.fee ?? 0, commission: body.commission ?? 0, currency: body.currency || 'CDF',
      provider: 'MPESA', purpose: body.purpose || 'MISSION', externalReference: body.externalReference || null,
      metadata: body.metadata ? JSON.stringify(body.metadata) : null, idempotencyKey,
    } })
    return NextResponse.json({ payment }, { status: 201 })
  }
  if (body.action === 'accept-quote') {
    const quote = await db.quote.findUnique({ where: { id: body.quoteId }, include: { request: true } })
    if (!quote || quote.request.clientId !== session.userId) return jsonError('Devis introuvable ou accès refusé', 404)
    const contract = await db.contract.create({ data: {
      requestId: quote.requestId, quoteId: quote.id, clientId: session.userId, providerId: quote.providerId,
      amount: quote.amount, currency: quote.currency, commissionRate: body.commissionRate ?? 5,
      status: ServiceRequestStatus.ACCEPTED,
    } })
    await db.quote.update({ where: { id: quote.id }, data: { status: 'ACCEPTED' } })
    await db.serviceRequest.update({ where: { id: quote.requestId }, data: { providerId: quote.providerId, status: ServiceRequestStatus.ACCEPTED } })
    return NextResponse.json({ contract }, { status: 201 })
  }
  if (body.action === 'confirm-funds') {
    const payment = await db.payment.findUnique({ where: { id: body.paymentId }, include: { contract: true } })
    if (!payment || (session.role !== 'ADMIN' && payment.payerId !== session.userId)) return jsonError('Paiement introuvable ou accès refusé', 404)
    if (!payment.contractId || !payment.contract) return jsonError('Le paiement doit être lié à un contrat')
    const escrow = await db.$transaction(async (tx) => {
      const updated = await tx.payment.update({ where: { id: payment.id }, data: { status: 'ESCROWED' } })
      const held = await tx.escrowTransaction.upsert({ where: { paymentId: payment.id }, update: { status: 'ESCROWED', amount: updated.amount }, create: { paymentId: payment.id, contractId: payment.contractId!, amount: updated.amount, status: 'ESCROWED' } })
      await tx.serviceRequest.update({ where: { id: payment.contract!.requestId }, data: { status: ServiceRequestStatus.ESCROWED } })
      return held
    })
    return NextResponse.json({ escrow })
  }
  if (body.action === 'release') {
    if (session.role !== 'ADMIN' && session.role !== 'CLIENT') return jsonError('Action non autorisée', 403)
    const escrow = await db.escrowTransaction.findUnique({ where: { id: body.escrowId }, include: { payment: true, contract: true } })
    if (!escrow || (session.role !== 'ADMIN' && escrow.payment.payerId !== session.userId)) return jsonError('Escrow introuvable ou accès refusé', 404)
    const idempotencyKey = String(body.idempotencyKey || '').trim()
    if (!idempotencyKey) return jsonError('Identifiant d’opération requis')
    const previous = await db.escrowRelease.findUnique({ where: { idempotencyKey } })
    if (previous) return NextResponse.json({ release: previous, duplicate: true })
    const releaseAmount = body.amount ?? escrow.amount
    const commission = body.commission ?? 0
    const release = await db.$transaction(async (tx) => {
      const row = await tx.escrowRelease.create({ data: { escrowId: escrow.id, paymentId: escrow.paymentId, milestoneId: body.milestoneId || null, amount: releaseAmount, commission, status: 'RELEASED', releasedAt: new Date(), idempotencyKey } })
      await tx.escrowTransaction.update({ where: { id: escrow.id }, data: { status: Number(releaseAmount) >= Number(escrow.amount) ? 'RELEASED' : 'PARTIAL_RELEASE', releasedAt: new Date() } })
      await tx.serviceRequest.update({ where: { id: escrow.contract.requestId }, data: { status: Number(releaseAmount) >= Number(escrow.amount) ? ServiceRequestStatus.COMPLETED : ServiceRequestStatus.PARTIAL_RELEASE } })
      return row
    })
    return NextResponse.json({ release }, { status: 201 })
  }
  if (body.action === 'dispute') {
    if (!body.contractId || !body.reason || !body.description) return jsonError('Contrat, motif et description requis')
    const contract = await db.contract.findUnique({ where: { id: body.contractId } })
    if (!contract || (session.role !== 'ADMIN' && contract.clientId !== session.userId && contract.providerId !== session.userId)) return jsonError('Contrat introuvable ou accès refusé', 404)
    const dispute = await db.dispute.create({ data: { contractId: contract.id, openedById: session.userId, reason: body.reason, description: body.description } })
    await db.contract.update({ where: { id: contract.id }, data: { status: ServiceRequestStatus.DISPUTED } })
    return NextResponse.json({ dispute }, { status: 201 })
  }
  return jsonError('Action inconnue')
}

export async function PATCH(req: NextRequest) {
  const session = sessionFrom(req)
  if (!session) return jsonError('Connexion requise', 401)
  const body = await req.json().catch(() => ({}))
  if (!body.requestId || !body.status) return jsonError('Demande et statut requis')
  const allowed = Object.values(ServiceRequestStatus) as string[]
  if (!allowed.includes(body.status)) return jsonError('Statut invalide')
  const request = await db.serviceRequest.findUnique({ where: { id: body.requestId } })
  if (!request) return jsonError('Demande introuvable', 404)
  if (session.role !== 'ADMIN' && request.clientId !== session.userId && request.providerId !== session.userId) return jsonError('Accès refusé', 403)
  const updated = await db.serviceRequest.update({ where: { id: body.requestId }, data: { status: body.status } })
  return NextResponse.json({ request: updated })
}
