import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';

function mapProfile(user: any) {
  if (user.role === 'CLIENT') {
    return {
      fullName: user.clientProfile?.fullName || null,
      email: user.clientProfile?.email || null,
    };
  }
  if (user.role === 'PRESTATAIRE') {
    let socialMedia = null;
    if (user.providerProfile?.socialMedia) {
      try { socialMedia = JSON.parse(user.providerProfile.socialMedia); } catch { socialMedia = null; }
    }
    // Support both service (single) and services (JSON array)
    let services: string[] = [];
    if (user.providerProfile?.services) {
      try { services = JSON.parse(user.providerProfile.services); } catch { services = []; }
    }
    if (services.length === 0 && user.providerProfile?.service) {
      services = [user.providerProfile.service];
    }
    return {
      fullName: user.providerProfile?.fullName || null,
      photo: user.providerProfile?.photoUrl || null,
      sector: user.providerProfile?.sector || null,
      services,
      province: user.providerProfile?.province || null,
      commune: user.providerProfile?.commune || null,
      nationalScope: user.providerProfile?.nationalScope || false,
      description: user.providerProfile?.description || null,
      socialMedia,
    };
  }
  if (user.role === 'ENTREPRISE') {
    let services: string[] = [];
    if (user.companyProfile?.services) {
      try { services = JSON.parse(user.companyProfile.services); } catch { services = []; }
    }
    let socialMedia = null;
    if (user.companyProfile?.socialMedia) {
      try { socialMedia = JSON.parse(user.companyProfile.socialMedia); } catch { socialMedia = null; }
    }
    return {
      companyName: user.companyProfile?.companyName || null,
      logo: user.companyProfile?.logoUrl || null,
      coverPhoto: user.companyProfile?.coverPhotoUrl || null,
      sector: user.companyProfile?.sector || null,
      services,
      companyType: user.companyProfile?.companyType || null,
      employeeCount: user.companyProfile?.employeeCount || null,
      description: user.companyProfile?.description || null,
      website: user.companyProfile?.website || null,
      fullAddress: user.companyProfile?.fullAddress || null,
      province: user.companyProfile?.province || null,
      commune: user.companyProfile?.commune || null,
      nationalScope: user.companyProfile?.nationalScope || false,
      socialMedia,
    };
  }
  return null;
}

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
      id: user.id,
      phone: user.phone,
      email: user.email,
      role: user.role,
      status: user.status,
      autoReplyMessage: user.autoReplyMessage || null,
      certified: user.certified || false,
      certificationStatus: user.certificationStatus || null,
      certificationMessage: user.certificationMessage || null,
      deletionReason: user.deletionReason || null,
      deletionRequestedAt: user.deletionRequestedAt || null,
      profile: mapProfile(user),
      suspensionMessage,
    });
  } catch (error) {
    console.error('Me error:', error);
    return NextResponse.json({ error: 'Erreur' }, { status: 500 });
  }
}
