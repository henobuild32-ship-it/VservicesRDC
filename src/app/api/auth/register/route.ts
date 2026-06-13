import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import { createSession } from '@/lib/session';

function makeSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'user';
}

function mapProfile(user: any) {
  if (user.role === 'CLIENT') {
    return { fullName: user.clientProfile?.fullName || null, email: user.clientProfile?.email || null };
  }
  if (user.role === 'PRESTATAIRE') {
    let services: string[] = [];
    if (user.providerProfile?.services) {
      try { services = JSON.parse(user.providerProfile.services); } catch { services = []; }
    }
    if (services.length === 0 && user.providerProfile?.service) services = [user.providerProfile.service];
    let socialMedia = null;
    if (user.providerProfile?.socialMedia) {
      try { socialMedia = JSON.parse(user.providerProfile.socialMedia); } catch { socialMedia = null; }
    }
    return {
      fullName: user.providerProfile?.fullName || null, photo: user.providerProfile?.photoUrl || null,
      sector: user.providerProfile?.sector || null, services, province: user.providerProfile?.province || null,
      commune: user.providerProfile?.commune || null, nationalScope: user.providerProfile?.nationalScope || false,
      description: user.providerProfile?.description || null, socialMedia,
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
      companyName: user.companyProfile?.companyName || null, logo: user.companyProfile?.logoUrl || null,
      coverPhoto: user.companyProfile?.coverPhotoUrl || null, sector: user.companyProfile?.sector || null,
      services,       companyType: user.companyProfile?.companyType || null,
      employeeCount: user.companyProfile?.employeeCount || null, description: user.companyProfile?.description || null, website: user.companyProfile?.website || null,
      fullAddress: user.companyProfile?.fullAddress || null, province: user.companyProfile?.province || null,
      commune: user.companyProfile?.commune || null, nationalScope: user.companyProfile?.nationalScope || false, socialMedia,
    };
  }
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phone, password, role, email, profile } = body;

    if (!phone || !password || !role) {
      return NextResponse.json({ error: 'Téléphone, mot de passe et type de compte sont requis' }, { status: 400 });
    }

    if (!['CLIENT', 'PRESTATAIRE', 'ENTREPRISE'].includes(role)) {
      return NextResponse.json({ error: 'Type de compte invalide' }, { status: 400 });
    }

    const existing = await db.user.findUnique({ where: { phone } });
    if (existing) {
      return NextResponse.json({ error: 'Ce numéro de téléphone est déjà utilisé' }, { status: 400 });
    }

    const hashedPassword = await hashPassword(password);
    const status = 'pending'; // Admin must validate

    const user = await db.user.create({
      data: {
        phone,
        password: hashedPassword,
        email: email || null,
        role,
        status,
      },
      include: { clientProfile: true, providerProfile: true, companyProfile: true },
    });

    if (role === 'CLIENT') {
      await db.clientProfile.create({
        data: {
          userId: user.id,
          fullName: profile?.fullName || null,
          email: profile?.email || email || null,
        },
      });
    }

    if (role === 'PRESTATAIRE' && profile) {
      const servicesArr = Array.isArray(profile.services) ? profile.services : [];
      const serviceValue = servicesArr[0] || '';
      const servicesJson = servicesArr.length > 0 ? JSON.stringify(servicesArr) : null;
      const pSlug = profile.fullName ? makeSlug(profile.fullName) + '-' + user.id.slice(0, 6) : 'prestataire-' + user.id.slice(0, 8);
      await db.providerProfile.create({
        data: {
          userId: user.id,
          fullName: profile.fullName || '',
          email: profile.email || email || '',
          phone,
          photoUrl: profile.photo || null,
          slug: pSlug,
          sector: profile.sector || '',
          service: serviceValue,
          services: servicesJson,
          province: profile.province || null,
          commune: profile.commune || null,
          description: profile.description || null,
          socialMedia: profile.socialMedia ? JSON.stringify(profile.socialMedia) : null,
          nationalScope: profile.nationalScope || false,
        },
      });
    }

    if (role === 'ENTREPRISE' && profile) {
      const eSlug = profile.companyName ? makeSlug(profile.companyName) + '-' + user.id.slice(0, 6) : 'entreprise-' + user.id.slice(0, 8);
      await db.companyProfile.create({
        data: {
          userId: user.id,
          companyName: profile.companyName || '',
          email: profile.email || email || '',
          phone,
          logoUrl: profile.logo || null,
          coverPhotoUrl: profile.coverPhoto || null,
          slug: eSlug,
          sector: profile.sector || '',
          companyType: profile.companyType || 'individuelle',
          employeeCount: profile.employeeCount || null,
          website: profile.website || null,
          fullAddress: profile.fullAddress || null,
          description: profile.description || null,
          services: Array.isArray(profile.services) ? JSON.stringify(profile.services) : null,
          province: profile.province || null,
          commune: profile.commune || null,
          socialMedia: profile.socialMedia ? JSON.stringify(profile.socialMedia) : null,
          nationalScope: profile.nationalScope || false,
        },
      });
    }

    const token = createSession(user.id, user.role);

    // Re-fetch with profiles included
    await db.userActivity.create({
      data: { userId: user.id, action: 'register', details: JSON.stringify({ role: user.role, time: new Date().toISOString() }) },
    });

    const userWithProfile = await db.user.findUnique({
      where: { id: user.id },
      include: { clientProfile: true, providerProfile: true, companyProfile: true },
    });

    return NextResponse.json({
      user: {
        id: user.id,
        phone: user.phone,
        email: user.email,
        role: user.role,
        status: user.status,
        certified: user.certified,
        certificationStatus: user.certificationStatus,
        certificationMessage: user.certificationMessage,
        autoReplyMessage: user.autoReplyMessage,
        deletionReason: user.deletionReason,
        deletionRequestedAt: user.deletionRequestedAt || null,
        profile: mapProfile(userWithProfile),
      },
      token,
    });
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json({ error: "Erreur lors de l'inscription" }, { status: 500 });
  }
}
