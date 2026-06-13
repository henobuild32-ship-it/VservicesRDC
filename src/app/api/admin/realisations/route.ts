import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    const session = getSession(token);
    if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });

    const realisations = await db.realisation.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    const parsed = realisations.map(r => ({
      ...r,
      media: (() => { try { return JSON.parse(r.media); } catch { return []; } })(),
      tags: (() => { try { return JSON.parse(r.tags || '[]'); } catch { return []; } })(),
    }));

    return NextResponse.json({ realisations: parsed });
  } catch (error) {
    console.error('Admin realisations error:', error);
    return NextResponse.json({ error: 'Erreur' }, { status: 500 });
  }
}
