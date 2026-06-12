import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';

function mapUserProfile(user: any) {
  if (user.role === 'CLIENT' && user.clientProfile) {
    return {
      fullName: user.clientProfile.fullName || null,
    };
  }
  if (user.role === 'PRESTATAIRE' && user.providerProfile) {
    const pp = user.providerProfile;
    let socialMedia = null;
    if (pp.socialMedia) {
      try { socialMedia = JSON.parse(pp.socialMedia); } catch { socialMedia = null; }
    }
    return {
      certified: user.certified || false,
      fullName: pp.fullName || null,
      photo: pp.photoUrl || null,
      sector: pp.sector || null,
      services: pp.service ? [pp.service] : [],
      province: pp.province || null,
      commune: pp.commune || null,
      nationalScope: pp.nationalScope || false,
      description: pp.description || null,
      socialMedia,
    };
  }
  if (user.role === 'ENTREPRISE' && user.companyProfile) {
    const cp = user.companyProfile;
    let services: string[] = [];
    if (cp.services) {
      try { services = JSON.parse(cp.services); } catch { services = []; }
    }
    let socialMedia = null;
    if (cp.socialMedia) {
      try { socialMedia = JSON.parse(cp.socialMedia); } catch { socialMedia = null; }
    }
    return {
      certified: user.certified || false,
      companyName: cp.companyName || null,
      description: cp.description || null,
      logo: cp.logoUrl || null,
      coverPhoto: cp.coverPhotoUrl || null,
      sector: cp.sector || null,
      services,
      province: cp.province || null,
      commune: cp.commune || null,
      nationalScope: cp.nationalScope || false,
      socialMedia,
    };
  }
  return {};
}

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    const session = getSession(token);
    if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const role = searchParams.get('role');
    const status = searchParams.get('status');

    const where: Record<string, unknown> = { role: { not: 'ADMIN' } };
    if (role && role !== 'all') where.role = role;
    if (status && status !== 'all') where.status = status;

    const users = await db.user.findMany({
      where,
      include: {
        clientProfile: true,
        providerProfile: true,
        companyProfile: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });

    const mappedUsers = users.map(u => ({
      id: u.id,
      phone: u.phone,
      email: u.email,
      role: u.role,
      status: u.status,
      certified: u.certified,
      createdAt: u.createdAt,
      deletionReason: u.deletionReason || null,
      deletionRequestedAt: u.deletionRequestedAt || null,
      profile: mapUserProfile(u),
    }));

    return NextResponse.json({ users: mappedUsers });
  } catch (error) {
    console.error('Admin users error:', error);
    return NextResponse.json({ error: 'Erreur' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    const session = getSession(token);
    if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });

    const body = await req.json();
    const { userId, action } = body;

    if (!userId || !action) return NextResponse.json({ error: 'userId et action requis' }, { status: 400 });

    if (action === 'reject-deletion') {
      await db.user.update({ where: { id: userId }, data: { deletionReason: null, deletionRequestedAt: null } });
      await db.notification.create({
        data: {
          userId,
          title: 'Demande de suppression refusée',
          message: 'Votre demande de suppression de compte a été refusée par l\'administration.',
          type: 'info',
        },
      });
    } else if (action === 'toggle-certification') {
      const user = await db.user.findUnique({ where: { id: userId } });
      if (!user) return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
      await db.user.update({ where: { id: userId }, data: { certified: !user.certified } });
    } else {
      return NextResponse.json({ error: 'Action inconnue' }, { status: 400 });
    }

    await db.adminAction.create({
      data: {
        adminId: session.userId,
        action: `user_${action}`,
        targetId: userId,
        details: `Action "${action}" sur l'utilisateur ${userId}`,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('User patch error:', error);
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
    const { userId } = body;

    if (!userId) return NextResponse.json({ error: 'userId requis' }, { status: 400 });

    // First notify the user their account is being deleted
    try {
      await db.notification.create({
        data: {
          userId: userId,
          title: 'Compte supprimé',
          message: 'Votre compte a été supprimé définitivement par l\'administration. Vous allez être déconnecté automatiquement.',
          type: 'warning',
        },
      });
    } catch { /* user may already be partially deleted */ }

    await db.adminAction.create({
      data: {
        adminId: session.userId,
        action: 'user_delete',
        targetId: userId,
        details: 'Utilisateur supprimé définitivement',
      },
    });

    await db.user.delete({ where: { id: userId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json({ error: 'Erreur' }, { status: 500 });
  }
}
