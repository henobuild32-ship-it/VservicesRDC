import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    const session = getSession(token);
    if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });

    const isHidden = req.nextUrl.searchParams.get('hidden');
    const where: Record<string, unknown> = {};
    if (isHidden === 'true') where.hidden = true;
    else if (isHidden === 'false') where.hidden = false;

    const reviews = await db.review.findMany({
      where,
      include: {
        author: { select: { phone: true, role: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });

    const mapped = reviews.map(r => ({
      id: r.id,
      authorPhone: r.author.phone,
      authorRole: r.author.role,
      targetId: r.targetId,
      targetType: r.targetType,
      rating: r.rating,
      comment: r.comment,
      hidden: r.hidden,
      createdAt: r.createdAt,
    }));

    return NextResponse.json({ reviews: mapped });
  } catch (error) {
    console.error('Admin reviews error:', error);
    return NextResponse.json({ error: 'Erreur' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    const session = getSession(token);
    if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });

    const body = await req.json();
    const { reviewId, action: revAction } = body;

    if (!reviewId) return NextResponse.json({ error: 'reviewId requis' }, { status: 400 });

    if (revAction === 'hide') {
      await db.review.update({ where: { id: reviewId }, data: { hidden: true } });
    } else if (revAction === 'show') {
      await db.review.update({ where: { id: reviewId }, data: { hidden: false } });
    } else {
      await db.review.delete({ where: { id: reviewId } });
    }

    await db.adminAction.create({
      data: {
        adminId: session.userId,
        action: revAction === 'hide' ? 'hide_review' : revAction === 'show' ? 'show_review' : 'delete_review',
        targetId: reviewId,
        details: `Avis ${revAction || 'supprimé'}`,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Review action error:', error);
    return NextResponse.json({ error: 'Erreur' }, { status: 500 });
  }
}
