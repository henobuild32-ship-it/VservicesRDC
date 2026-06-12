import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    const session = getSession(token);
    if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });

    const body = await req.json();
    const { title, message, targetType, targetId } = body;

    if (!title || !message || !targetType) {
      return NextResponse.json({ error: 'Données manquantes' }, { status: 400 });
    }

    // Create the announcement record
    await db.adminAnnouncement.create({
      data: {
        authorId: session.userId,
        title,
        message: message + '\n\nL\'Équipe HenoBuild',
        targetType,
        targetId: targetId || null,
      },
    });

    // Determine target users
    const targetWhere: Record<string, unknown> = {};
    switch (targetType) {
      case 'all_prestataires':
        targetWhere.role = 'PRESTATAIRE';
        targetWhere.status = 'approved';
        break;
      case 'all_entreprises':
        targetWhere.role = 'ENTREPRISE';
        targetWhere.status = 'approved';
        break;
      case 'all_providers':
        targetWhere.role = { in: ['PRESTATAIRE', 'ENTREPRISE'] };
        targetWhere.status = 'approved';
        break;
      case 'all_clients':
        targetWhere.role = 'CLIENT';
        targetWhere.status = 'approved';
        break;
      case 'specific':
        if (!targetId) return NextResponse.json({ error: 'targetId requis pour le ciblage spécifique' }, { status: 400 });
        break;
    }

    let userIds: string[] = [];

    if (targetType === 'specific' && targetId) {
      userIds = [targetId];
    } else {
      const users = await db.user.findMany({
        where: targetWhere,
        select: { id: true },
      });
      userIds = users.map(u => u.id);
    }

    // Create notifications for all targets
    const notifications = userIds.map(userId => ({
      userId,
      title,
      message: message + '\n\nL\'Équipe HenoBuild',
      type: 'announcement',
    }));

    if (notifications.length > 0) {
      await db.notification.createMany({ data: notifications });
    }

    return NextResponse.json({ success: true, count: notifications.length });
  } catch (error) {
    console.error('Announcement error:', error);
    return NextResponse.json({ error: 'Erreur' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    const session = getSession(token);
    if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });

    const announcements = await db.adminAnnouncement.findMany({
      include: { author: { select: { id: true } } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({ announcements });
  } catch (error) {
    console.error('Get announcements error:', error);
    return NextResponse.json({ error: 'Erreur' }, { status: 500 });
  }
}
