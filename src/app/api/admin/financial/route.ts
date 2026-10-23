import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'

export async function GET(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  const session = token ? getSession(token) : null
  if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
  const [payments, escrow, releases, refunds, subscriptions, disputes] = await Promise.all([
    db.payment.findMany({
      include: {
        payer: { select: { phone: true } },
        beneficiary: { select: { phone: true } },
        contract: { include: { request: true } },
        escrow: true,
        releases: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    }),
    db.escrowTransaction.findMany({ where: { status: { in: ['ESCROWED', 'PARTIAL_RELEASE'] } } }),
    db.escrowRelease.findMany({ where: { status: 'RELEASED' } }),
    db.refund.findMany({ orderBy: { createdAt: 'desc' }, take: 100 }),
    db.subscription.findMany({ where: { status: 'ACTIVE' } }),
    db.dispute.findMany({ where: { status: { in: ['OPEN', 'ADMIN_REVIEW'] } }, include: { contract: true } }),
  ])
  const sum = (rows: any[], key: string) => rows.reduce((total, row) => total + Number(row[key] || 0), 0)
  return NextResponse.json({ payments, escrow, releases, refunds, subscriptions, disputes, totals: {
    received: sum(payments, 'amount'), fees: sum(payments, 'fee'), commissions: sum(payments, 'commission'),
    heldInEscrow: sum(escrow, 'amount'), released: sum(releases, 'amount'), refunded: sum(refunds, 'amount'), subscriptions: sum(subscriptions, 'price'),
  } })
}
