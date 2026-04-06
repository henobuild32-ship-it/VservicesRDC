import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, message } = body;

    if (!name || !email || !message) {
      return NextResponse.json({ error: 'Tous les champs sont requis' }, { status: 400 });
    }

    let userId: string | null = null;

    // Check if user is logged in
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (token) {
      const session = getSession(token);
      if (session) userId = session.userId;
    }

    const contactMessage = await db.contactMessage.create({
      data: {
        userId,
        name,
        email,
        message,
      },
    });

    return NextResponse.json({ success: true, id: contactMessage.id });
  } catch (error) {
    console.error('Contact error:', error);
    return NextResponse.json({ error: 'Erreur' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    const session = getSession(token);
    if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    const messages = await db.contactMessage.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ messages });
  } catch (error) {
    console.error('Get contact messages error:', error);
    return NextResponse.json({ error: 'Erreur' }, { status: 500 });
  }
}
