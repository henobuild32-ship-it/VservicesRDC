import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    const session = getSession(token);
    if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    if (session.role === 'PRESTATAIRE') {
      const p = await db.providerProfile.findUnique({ where: { userId: session.userId } });
      if (p) return NextResponse.json({ slug: p.slug });
    }
    if (session.role === 'ENTREPRISE') {
      const c = await db.companyProfile.findUnique({ where: { userId: session.userId } });
      if (c) return NextResponse.json({ slug: c.slug });
    }
    return NextResponse.json({ slug: session.userId });
  } catch (error) {
    console.error('Public me error:', error);
    return NextResponse.json({ error: 'Erreur' }, { status: 500 });
  }
}
