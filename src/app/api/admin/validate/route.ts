import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';

export async function PUT(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    const session = getSession(token);
    if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });

    const body = await req.json();
    const { userId, action, reason } = body;

    if (!userId || !action) {
      return NextResponse.json({ error: 'Données manquantes' }, { status: 400 });
    }

    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });

    let newStatus: string;
    if (action === 'approve') newStatus = 'approved';
    else if (action === 'reject') newStatus = 'rejected';
    else if (action === 'suspend') newStatus = 'suspended';
    else if (action === 'activate') newStatus = 'approved';
    else return NextResponse.json({ error: 'Action invalide' }, { status: 400 });

    await db.user.update({
      where: { id: userId },
      data: { status: newStatus },
    });

    // Create notification for the user
    const titleMap: Record<string, string> = {
      approve: 'Compte approuvé',
      reject: 'Compte refusé',
      suspend: 'Compte suspendu',
      activate: 'Comme réactivé',
    };
    const messageMap: Record<string, string> = {
      approve: 'Votre compte a été approuvé. Vous pouvez maintenant utiliser pleinement la plateforme VServiceRDC.',
      reject: 'Votre compte a été refusé. Pour plus d\'informations, contactez l\'administration.',
      suspend: reason || 'Votre compte a été suspendu par l\'administration. Pour plus d\'informations, contactez le support.',
      activate: 'Votre compte a été réactivé. Bienvenue à nouveau sur VServiceRDC.',
    };

    await db.notification.create({
      data: {
        userId,
        title: titleMap[action],
        message: messageMap[action] + '\n\nL\'Équipe HenoBuild',
        type: action === 'suspend' ? 'warning' : 'info',
      },
    });

    return NextResponse.json({ success: true, status: newStatus });
  } catch (error) {
    console.error('Validate error:', error);
    return NextResponse.json({ error: 'Erreur' }, { status: 500 });
  }
}
