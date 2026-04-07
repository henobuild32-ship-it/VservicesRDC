import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';

// GET: Get messages for a conversation
export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    const session = getSession(token);
    if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get('conversationId');
    if (!conversationId) {
      return NextResponse.json({ error: 'conversationId requis' }, { status: 400 });
    }

    // Verify user is participant
    const conv = await db.conversation.findFirst({
      where: {
        id: conversationId,
        OR: [
          { participant1Id: session.userId },
          { participant2Id: session.userId },
        ],
      },
    });

    if (!conv) {
      return NextResponse.json({ error: 'Conversation non trouvée' }, { status: 404 });
    }

    // Mark messages as read
    await db.chatMessage.updateMany({
      where: {
        conversationId,
        senderId: { not: session.userId },
        read: false,
      },
      data: { read: true },
    });

    const messages = await db.chatMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        senderId: true,
        content: true,
        read: true,
        createdAt: true,
      },
      take: 100,
    });

    return NextResponse.json({ messages });
  } catch (error) {
    console.error('Get messages error:', error);
    return NextResponse.json({ error: 'Erreur' }, { status: 500 });
  }
}

// POST: Send a message in a conversation
export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    const session = getSession(token);
    if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    const body = await req.json();
    const { conversationId, content } = body;

    if (!conversationId || !content) {
      return NextResponse.json({ error: 'conversationId et content requis' }, { status: 400 });
    }

    // Verify user is participant
    const conv = await db.conversation.findFirst({
      where: {
        id: conversationId,
        OR: [
          { participant1Id: session.userId },
          { participant2Id: session.userId },
        ],
      },
    });

    if (!conv) {
      return NextResponse.json({ error: 'Conversation non trouvée' }, { status: 404 });
    }

    const message = await db.chatMessage.create({
      data: {
        conversationId,
        senderId: session.userId,
        content,
      },
    });

    // Update conversation timestamp
    await db.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: new Date() },
    });

    return NextResponse.json({ message: { id: message.id, senderId: message.senderId, content: message.content, createdAt: message.createdAt } });
  } catch (error) {
    console.error('Send message error:', error);
    return NextResponse.json({ error: 'Erreur' }, { status: 500 });
  }
}
