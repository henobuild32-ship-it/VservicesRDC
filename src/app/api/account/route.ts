import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';

// POST: Request account deletion (user sends reason)
export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    const session = getSession(token);
    if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    const body = await req.json();
    if (!body.reason || body.reason.trim().length < 5) {
      return NextResponse.json({ error: 'Veuillez fournir une raison (min 5 caractères)' }, { status: 400 });
    }

    await db.user.update({
      where: { id: session.userId },
      data: {
        deletionReason: body.reason,
        deletionRequestedAt: new Date(),
      },
    });

    // Create notification for admin
    const adminUsers = await db.user.findMany({ where: { role: 'ADMIN' } });
    for (const admin of adminUsers) {
      await db.notification.create({
        data: {
          userId: admin.id,
          title: 'Demande de suppression de compte',
          message: `L'utilisateur ${session.userId} a demandé la suppression de son compte. Raison: ${body.reason}`,
          type: 'warning',
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Deletion request error:', error);
    return NextResponse.json({ error: 'Erreur' }, { status: 500 });
  }
}

// DELETE: Cancel deletion request
export async function DELETE(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    const session = getSession(token);
    if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    await db.user.update({
      where: { id: session.userId },
      data: {
        deletionReason: null,
        deletionRequestedAt: null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Cancel deletion error:', error);
    return NextResponse.json({ error: 'Erreur' }, { status: 500 });
  }
}
