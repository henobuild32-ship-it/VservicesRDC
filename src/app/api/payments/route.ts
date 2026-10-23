import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'

function auth(req: NextRequest) { const token = req.headers.get('authorization')?.replace(/^Bearer\s+/i, ''); return token ? getSession(token) : null }
function error(message: string, status = 400) { return NextResponse.json({ error: message }, { status }) }

export async function GET(req: NextRequest) {
  const session = auth(req)
  if (!session) return error('Connexion requise', 401)
  const settings = await db.platformSetting.findMany({ where: { key: { in: ['mpesa_platform_phone', 'withdrawal_fee_usd', 'exchange_rate'] } } })
  const config: Record<string, string> = { mpesa_platform_phone: '+243862719972', withdrawal_fee_usd: '1.80' }
  for (const setting of settings) config[setting.key] = setting.value
  if (session.role === 'ADMIN') {
    const payments = await db.payment.findMany({ include: { payer: { select: { phone: true } }, beneficiary: { select: { phone: true } }, contract: { include: { request: true } } } , orderBy: { createdAt: 'desc' }, take: 200 })
    return NextResponse.json({ config, payments })
  }
  const payments = await db.payment.findMany({ where: { payerId: session.userId }, orderBy: { createdAt: 'desc' }, take: 100 })
  return NextResponse.json({ config, payments })
}

export async function POST(req: NextRequest) {
  const session = auth(req)
  if (!session) return error('Connexion requise', 401)
  const body = await req.json().catch(() => ({}))
  if (body.action !== 'proof') return error('Action inconnue')
  if (!body.paymentId || !body.transactionReference || !body.proofUrl || body.amountReceived == null) return error('Paiement, référence, montant et preuve requis')
  const payment = await db.payment.findUnique({ where: { id: body.paymentId } })
  if (!payment || (session.role !== 'ADMIN' && payment.payerId !== session.userId)) return error('Paiement introuvable ou accès refusé', 404)
  const duplicate = await db.payment.findUnique({ where: { transactionReference: String(body.transactionReference).trim() } })
  if (duplicate && duplicate.id !== payment.id) return error('Cette référence M-Pesa a déjà été utilisée')
  const received = Number(body.amountReceived)
  const expected = Number(payment.amount) + Number(payment.fee)
  if (!Number.isFinite(received) || received < expected) return error(`Montant insuffisant. Total attendu : ${expected}`)
  const updated = await db.payment.update({ where: { id: payment.id }, data: { transactionReference: String(body.transactionReference).trim(), proofUrl: body.proofUrl, status: 'PENDING_VERIFICATION', metadata: JSON.stringify({ ...(payment.metadata ? JSON.parse(payment.metadata) : {}), amountReceived: received }) } })
  return NextResponse.json({ payment: updated })
}

export async function PATCH(req: NextRequest) {
  const session = auth(req)
  if (!session || session.role !== 'ADMIN') return error('Accès refusé', 403)
  const body = await req.json().catch(() => ({}))
  if (!body.paymentId || !['VALIDATE', 'REJECT'].includes(body.action)) return error('Action admin invalide')
  const payment = await db.payment.findUnique({ where: { id: body.paymentId, status: 'PENDING_VERIFICATION' }, include: { contract: true } })
  if (!payment) return error('Paiement en attente introuvable', 404)
  if (body.action === 'REJECT') {
    const rejected = await db.payment.update({ where: { id: payment.id }, data: { status: 'REJECTED', rejectionReason: body.reason || 'Preuve non validée' } })
    return NextResponse.json({ payment: rejected })
  }
  const result = await db.$transaction(async tx => {
    const validated = await tx.payment.update({ where: { id: payment.id }, data: { status: 'VALIDATED', verifiedAt: new Date() } })
    if (payment.contractId && payment.contract) {
      await tx.escrowTransaction.upsert({ where: { paymentId: payment.id }, update: { status: 'ESCROWED' }, create: { paymentId: payment.id, contractId: payment.contractId, amount: payment.amount, status: 'ESCROWED' } })
      await tx.serviceRequest.update({ where: { id: payment.contract.requestId }, data: { status: 'ESCROWED' } })
    } else if (payment.purpose === 'SUBSCRIPTION') {
      let metadata: any = {}; try { metadata = payment.metadata ? JSON.parse(payment.metadata) : {} } catch { /* ignore */ }
      await tx.subscription.create({ data: { userId: payment.payerId, plan: metadata.plan || 'Premium', price: payment.amount, commissionRate: 0, startsAt: new Date(), endsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), status: 'ACTIVE', payment: { create: { paymentId: payment.id } } } })
    }
    return validated
  })
  return NextResponse.json({ payment: result })
}
