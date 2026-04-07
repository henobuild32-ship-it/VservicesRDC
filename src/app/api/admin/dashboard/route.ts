import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    const session = getSession(token);
    if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });

    const [
      totalUsers,
      totalClients,
      totalPrestataires,
      totalEntreprises,
      pendingUsers,
      approvedUsers,
      suspendedUsers,
      totalReviews,
      totalMessages,
      unreadMessages,
    ] = await Promise.all([
      db.user.count({ where: { role: { not: 'ADMIN' } } }),
      db.user.count({ where: { role: 'CLIENT' } }),
      db.user.count({ where: { role: 'PRESTATAIRE' } }),
      db.user.count({ where: { role: 'ENTREPRISE' } }),
      db.user.count({ where: { status: 'pending', role: { in: ['PRESTATAIRE', 'ENTREPRISE'] } } }),
      db.user.count({ where: { status: 'approved' } }),
      db.user.count({ where: { status: 'suspended' } }),
      db.review.count(),
      db.contactMessage.count(),
      db.contactMessage.count({ where: { read: false } }),
    ]);

    return NextResponse.json({
      totalUsers,
      clients: totalClients,
      prestataires: totalPrestataires,
      entreprises: totalEntreprises,
      pending: pendingUsers,
      approved: approvedUsers,
      suspended: suspendedUsers,
      reviews: totalReviews,
      messages: totalMessages,
      unreadMessages,
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json({ error: 'Erreur' }, { status: 500 });
  }
}
