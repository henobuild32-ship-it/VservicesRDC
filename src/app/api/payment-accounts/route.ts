import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'

function session(req: NextRequest) { const token = req.headers.get('authorization')?.replace(/^Bearer\s+/i, ''); return token ? getSession(token) : null }
function fail(message: string, status = 400) { return NextResponse.json({ error: message }, { status }) }
function mask(phone: string) { return phone.length > 4 ? `${phone.slice(0, 4)}••••${phone.slice(-2)}` : '••••' }

export async function GET(req: NextRequest) {
  const current = session(req); if (!current) return fail('Connexion requise', 401)
  const userId = current.role === 'ADMIN' ? new URL(req.url).searchParams.get('userId') : current.userId
  if (!userId) return fail('Utilisateur requis')
  const accounts = await db.paymentAccount.findMany({ where: { userId }, select: { id: true, operator: true, holderName: true, isDefault: true, maskedPhone: true, createdAt: true, updatedAt: true } })
  return NextResponse.json({ accounts })
}

export async function POST(req: NextRequest) {
  const current = session(req); if (!current) return fail('Connexion requise', 401)
  const body = await req.json().catch(() => ({}))
  const operator = String(body.operator || '').trim()
  const phone = String(body.phone || '').trim()
  const phoneConfirmation = String(body.phoneConfirmation || '').trim()
  const holderName = String(body.holderName || '').trim()
  if (!['M-Pesa', 'Airtel Money', 'Afri Money', 'Orange Money', 'BANQUE'].includes(operator)) return fail('Opérateur invalide')
  if (!holderName || !phone || phone !== phoneConfirmation) return fail('Nom et double confirmation du numéro requis')
  if (operator === 'BANQUE' && (!body.bankName || !body.accountNumber)) return fail('Banque et numéro de compte requis')
  if (operator !== 'BANQUE' && !/^\+243[0-9]{9}$/.test(phone)) return fail('Le numéro doit être au format +243XXXXXXXXX')
  const account = await db.paymentAccount.create({ data: { userId: current.userId, operator, phone, holderName, bankName: body.bankName || null, accountNumber: body.accountNumber || null, branch: body.branch || null, swift: body.swift || null, maskedPhone: operator === 'BANQUE' ? `••••${phone.slice(-4)}` : mask(phone), isDefault: Boolean(body.isDefault) } })
  if (account.isDefault) await db.paymentAccount.updateMany({ where: { userId: current.userId, id: { not: account.id } }, data: { isDefault: false } })
  await db.userActivity.create({ data: { userId: current.userId, action: 'payment_account_added', details: JSON.stringify({ operator, maskedPhone: account.maskedPhone }) } })
  return NextResponse.json({ account: { id: account.id, operator, holderName, maskedPhone: account.maskedPhone, isDefault: account.isDefault } }, { status: 201 })
}

export async function PATCH(req: NextRequest) {
  const current = session(req); if (!current) return fail('Connexion requise', 401)
  const body = await req.json().catch(() => ({})); if (!body.id) return fail('Compte requis')
  const account = await db.paymentAccount.findUnique({ where: { id: body.id } })
  if (!account || (current.role !== 'ADMIN' && account.userId !== current.userId)) return fail('Compte introuvable ou accès refusé', 404)
  if (body.action === 'default') {
    await db.paymentAccount.updateMany({ where: { userId: account.userId }, data: { isDefault: false } })
    const updated = await db.paymentAccount.update({ where: { id: account.id }, data: { isDefault: true } })
    return NextResponse.json({ account: updated })
  }
  if (body.action === 'delete') { await db.paymentAccount.delete({ where: { id: account.id } }); return NextResponse.json({ success: true }) }
  return fail('Action inconnue')
}
