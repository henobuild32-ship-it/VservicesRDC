import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    const session = getSession(token);
    if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });

    const users = await db.user.findMany({
      where: {
        OR: [
          { certificationStatus: { not: null } },
          { certified: true },
        ],
        role: { in: ['PRESTATAIRE', 'ENTREPRISE'] },
      },
      include: {
        providerProfile: { select: { fullName: true, photoUrl: true, sector: true } },
        companyProfile: { select: { companyName: true, logoUrl: true, sector: true } },
      },
      orderBy: { certificationRequestedAt: 'desc' },
    });

    const requests = users.map(u => ({
      id: u.id,
      phone: u.phone,
      role: u.role,
      certified: u.certified,
      certificationStatus: u.certificationStatus,
      certificationMessage: u.certificationMessage,
      certificationRequestedAt: u.certificationRequestedAt,
      name: u.providerProfile?.fullName || u.companyProfile?.companyName || u.phone,
      photo: u.providerProfile?.photoUrl || u.companyProfile?.logoUrl || null,
      sector: u.providerProfile?.sector || u.companyProfile?.sector || null,
    }));

    return NextResponse.json({ requests });
  } catch (error) {
    console.error('Admin certification error:', error);
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
    const { userId, action, message } = body;

    if (!userId || !action) return NextResponse.json({ error: 'userId et action requis' }, { status: 400 });

    if (action === 'approve') {
      await db.user.update({
        where: { id: userId },
        data: { certified: true, certificationStatus: null, certificationMessage: message || null },
      });
      await db.notification.create({
        data: {
          userId,
          title: 'Certification approuvée',
          message: message || 'Félicitations ! Votre certification a été approuvée.',
          type: 'certification_approved',
        },
      });
    } else if (action === 'reject') {
      await db.user.update({
        where: { id: userId },
        data: { certified: false, certificationStatus: 'rejected', certificationMessage: message || null },
      });
      await db.notification.create({
        data: {
          userId,
          title: 'Certification refusée',
          message: message || 'Votre demande de certification a été refusée.',
          type: 'certification_rejected',
        },
      });
    } else if (action === 'pending') {
      await db.user.update({
        where: { id: userId },
        data: { certified: false, certificationStatus: 'pending', certificationMessage: message || null },
      });
      await db.notification.create({
        data: {
          userId,
          title: 'Certification en attente',
          message: message || 'Votre demande de certification est en cours de traitement.',
          type: 'certification_pending',
        },
      });
    } else {
      return NextResponse.json({ error: 'Action inconnue' }, { status: 400 });
    }

    await db.adminAction.create({
      data: {
        adminId: session.userId,
        action: `certification_${action}`,
        targetId: userId,
        details: message ? `${action}: ${message}` : action,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Certification action error:', error);
    return NextResponse.json({ error: 'Erreur' }, { status: 500 });
  }
}
