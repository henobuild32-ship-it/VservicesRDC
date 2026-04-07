import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    const session = getSession(token);
    if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });

    const messages = await db.contactMessage.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return NextResponse.json({ messages });
  } catch (error) {
    console.error('Get messages error:', error);
    return NextResponse.json({ error: 'Erreur' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    const session = getSession(token);
    if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });

    const body = await req.json();
    const { messageId, reply } = body;

    if (!messageId || !reply) {
      return NextResponse.json({ error: 'Données manquantes' }, { status: 400 });
    }

    const message = await db.contactMessage.update({
      where: { id: messageId },
      data: { reply, repliedAt: new Date(), read: true },
    });

    // Notify the user
    if (message.userId) {
      await db.notification.create({
        data: {
          userId: message.userId,
          title: 'Réponse à votre message',
          message: reply + '\n\nL\'Équipe HenoBuild',
          type: 'info',
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Reply message error:', error);
    return NextResponse.json({ error: 'Erreur' }, { status: 500 });
  }
}
