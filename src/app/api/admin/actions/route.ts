import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    const session = getSession(token);
    if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });

    const actions = await db.adminAction.findMany({
      orderBy: { createdAt: 'desc' },
      take: 200,
    });

    return NextResponse.json({ actions });
  } catch (error) {
    console.error('Admin actions error:', error);
    return NextResponse.json({ error: 'Erreur' }, { status: 500 });
  }
}
