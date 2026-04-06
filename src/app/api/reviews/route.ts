import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const targetId = searchParams.get('targetId');

    if (!targetId) {
      return NextResponse.json({ error: 'targetId requis' }, { status: 400 });
    }

    const reviews = await db.review.findMany({
      where: { targetId },
      include: {
        author: {
          select: {
            id: true,
            clientProfile: { select: { fullName: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const avgRating = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : null;

    return NextResponse.json({ reviews, avgRating: avgRating ? Math.round(avgRating * 10) / 10 : 0, count: reviews.length });
  } catch (error) {
    console.error('Get reviews error:', error);
    return NextResponse.json({ error: 'Erreur' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    const session = getSession(token);
    if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    if (session.role !== 'CLIENT') {
      return NextResponse.json({ error: 'Seuls les clients peuvent laisser des avis' }, { status: 403 });
    }

    const body = await req.json();
    const { targetId, targetType, rating, comment } = body;

    if (!targetId || !targetType || !rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Données invalides' }, { status: 400 });
    }

    // Check if already reviewed
    const existing = await db.review.findFirst({
      where: { authorId: session.userId, targetId },
    });

    if (existing) {
      return NextResponse.json({ error: 'Vous avez déjà laissé un avis' }, { status: 400 });
    }

    const review = await db.review.create({
      data: {
        authorId: session.userId,
        targetId,
        targetType,
        rating,
        comment: comment || null,
      },
    });

    return NextResponse.json({ review });
  } catch (error) {
    console.error('Create review error:', error);
    return NextResponse.json({ error: 'Erreur' }, { status: 500 });
  }
}
