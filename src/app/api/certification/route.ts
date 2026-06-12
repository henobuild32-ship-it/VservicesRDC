import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    const session = getSession(token);
    if (!session) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });

    const user = await db.user.findUnique({ where: { id: session.userId } });
    if (!user || (user.role !== 'PRESTATAIRE' && user.role !== 'ENTREPRISE')) {
      return NextResponse.json({ error: 'Seuls les prestataires et entreprises peuvent demander la certification' }, { status: 403 });
    }
    if (user.certificationStatus === 'pending') {
      return NextResponse.json({ error: 'Vous avez déjà une demande en attente' }, { status: 400 });
    }
    if (user.certified) {
      return NextResponse.json({ error: 'Vous êtes déjà certifié' }, { status: 400 });
    }

    await db.user.update({
      where: { id: session.userId },
      data: { certificationStatus: 'pending', certificationRequestedAt: new Date(), certificationMessage: null },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Certification request error:', error);
    return NextResponse.json({ error: 'Erreur' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    const session = getSession(token);
    if (!session) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });

    const user = await db.user.findUnique({
      where: { id: session.userId },
      select: { certificationStatus: true, certificationMessage: true, certified: true },
    });

    return NextResponse.json(user || {});
  } catch (error) {
    console.error('Certification status error:', error);
    return NextResponse.json({ error: 'Erreur' }, { status: 500 });
  }
}
