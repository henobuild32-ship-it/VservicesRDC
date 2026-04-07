import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';

// GET: List conversations for current user
export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    const session = getSession(token);
    if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    const conversations = await db.conversation.findMany({
      where: {
        OR: [
          { participant1Id: session.userId },
          { participant2Id: session.userId },
        ],
      },
      include: {
        participant1: {
          select: { id: true, phone: true, role: true, clientProfile: { select: { fullName: true } }, providerProfile: { select: { fullName: true, photoUrl: true } }, companyProfile: { select: { companyName: true, logoUrl: true } } },
        },
        participant2: {
          select: { id: true, phone: true, role: true, clientProfile: { select: { fullName: true } }, providerProfile: { select: { fullName: true, photoUrl: true } }, companyProfile: { select: { companyName: true, logoUrl: true } } },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { content: true, senderId: true, createdAt: true, read: true },
        },
      },
      orderBy: { lastMessageAt: 'desc' },
    });

    // Get unread count per conversation
    const unreadCounts: Record<string, number> = {};
    for (const conv of conversations) {
      const count = await db.chatMessage.count({
        where: {
          conversationId: conv.id,
          senderId: { not: session.userId },
          read: false,
        },
      });
      unreadCounts[conv.id] = count;
    }

    const formatted = conversations.map(conv => {
      const otherUser = conv.participant1Id === session.userId ? conv.participant2 : conv.participant1;
      const otherProfile = otherUser.providerProfile || otherUser.companyProfile || otherUser.clientProfile;
      return {
        id: conv.id,
        otherUser: {
          id: otherUser.id,
          phone: otherUser.phone,
          role: otherUser.role,
          name: otherUser.providerProfile?.fullName || otherUser.companyProfile?.companyName || otherUser.clientProfile?.fullName || otherUser.phone,
          photo: otherUser.providerProfile?.photoUrl || otherUser.companyProfile?.logoUrl || null,
        },
        lastMessage: conv.messages[0] || null,
        unreadCount: unreadCounts[conv.id] || 0,
        lastMessageAt: conv.lastMessageAt,
      };
    });

    return NextResponse.json({ conversations: formatted });
  } catch (error) {
    console.error('Get conversations error:', error);
    return NextResponse.json({ error: 'Erreur' }, { status: 500 });
  }
}

// POST: Create a new conversation or get existing one
export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    const session = getSession(token);
    if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    const body = await req.json();
    const { recipientId, message } = body;

    if (!recipientId) {
      return NextResponse.json({ error: 'Destinataire requis' }, { status: 400 });
    }

    // Find or create conversation
    const [idA, idB] = session.userId < recipientId ? [session.userId, recipientId] : [recipientId, session.userId];
    let conversation = await db.conversation.findUnique({
      where: {
        participant1Id_participant2Id: { participant1Id: idA, participant2Id: idB },
      },
    });

    if (!conversation) {
      conversation = await db.conversation.create({
        data: { participant1Id: idA, participant2Id: idB },
      });
    }

    // Send initial message if provided
    if (message) {
      await db.chatMessage.create({
        data: {
          conversationId: conversation.id,
          senderId: session.userId,
          content: message,
        },
      });
      await db.conversation.update({
        where: { id: conversation.id },
        data: { lastMessageAt: new Date() },
      });
    }

    return NextResponse.json({ conversationId: conversation.id });
  } catch (error) {
    console.error('Create conversation error:', error);
    return NextResponse.json({ error: 'Erreur' }, { status: 500 });
  }
}
