import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    const session = getSession(token);
    if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    const url = new URL(req.url);
    const userId = url.searchParams.get('userId') || session.userId;

    const realisations = await db.realisation.findMany({
      where: { userId, hidden: userId === session.userId ? undefined : false },
      orderBy: { createdAt: 'desc' },
    });

    const parsed = realisations.map(r => ({
      ...r,
      media: (() => { try { return JSON.parse(r.media); } catch { return []; } })(),
      tags: (() => { try { return JSON.parse(r.tags || '[]'); } catch { return []; } })(),
    }));

    return NextResponse.json({ realisations: parsed });
  } catch (error) {
    console.error('Realisations error:', error);
    return NextResponse.json({ error: 'Erreur' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    const session = getSession(token);
    if (!session || session.role === 'CLIENT') return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });

    const body = await req.json();
    const { title, description, media, mediaType, beforePhoto, afterPhoto, location, date, tags } = body;

    if (!title) return NextResponse.json({ error: 'Titre requis' }, { status: 400 });

    const realisation = await db.realisation.create({
      data: {
        userId: session.userId,
        userRole: session.role,
        title,
        description: description || null,
        media: JSON.stringify(media || []),
        mediaType: mediaType || 'image',
        beforePhoto: beforePhoto || null,
        afterPhoto: afterPhoto || null,
        location: location || null,
        date: date || null,
        tags: tags ? JSON.stringify(tags) : null,
      },
    });

    return NextResponse.json({ realisation });
  } catch (error) {
    console.error('Create realisation error:', error);
    return NextResponse.json({ error: 'Erreur' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    const session = getSession(token);
    if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID requis' }, { status: 400 });

    const r = await db.realisation.findUnique({ where: { id } });
    if (!r || r.userId !== session.userId) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });

    await db.realisation.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete realisation error:', error);
    return NextResponse.json({ error: 'Erreur' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    const session = getSession(token);
    if (!session || (session.role !== 'ADMIN' && session.role === 'CLIENT')) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });

    const body = await req.json();
    const { id, hidden } = body;
    if (!id) return NextResponse.json({ error: 'ID requis' }, { status: 400 });

    if (session.role === 'ADMIN') {
      await db.realisation.update({ where: { id }, data: { hidden: hidden !== undefined ? hidden : undefined } });
    } else {
      const r = await db.realisation.findUnique({ where: { id } });
      if (!r || r.userId !== session.userId) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
      await db.realisation.update({ where: { id }, data: { hidden: hidden !== undefined ? hidden : undefined } });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update realisation error:', error);
    return NextResponse.json({ error: 'Erreur' }, { status: 500 });
  }
}
