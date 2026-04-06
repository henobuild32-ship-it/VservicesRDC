import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const session = getSession(token);
    if (!session) {
      return NextResponse.json({ error: 'Session expirée' }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { id: session.userId },
      include: {
        clientProfile: true,
        providerProfile: true,
        companyProfile: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    // Check for suspension message
    let suspensionMessage: string | null = null;
    if (user.status === 'suspended') {
      const notifications = await db.notification.findMany({
        where: { userId: user.id, type: 'warning' },
        orderBy: { createdAt: 'desc' },
        take: 1,
      });
      if (notifications.length > 0) {
        suspensionMessage = notifications[0].message;
      }
    }

    return NextResponse.json({
      user: {
        id: user.id,
        phone: user.phone,
        email: user.email,
        role: user.role,
        status: user.status,
        clientProfile: user.clientProfile,
        providerProfile: user.providerProfile,
        companyProfile: user.companyProfile,
      },
      suspensionMessage,
    });
  } catch (error) {
    console.error('Me error:', error);
    return NextResponse.json({ error: 'Erreur' }, { status: 500 });
  }
}
