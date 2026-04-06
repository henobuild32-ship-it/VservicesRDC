import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import { createSession } from '@/lib/session';

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
    const status = role === 'CLIENT' ? 'approved' : 'pending';

    const user = await db.user.create({
      data: {
        phone,
        password: hashedPassword,
        email: email || null,
        role,
        status,
      },
    });

    if (role === 'CLIENT') {
      await db.clientProfile.create({
        data: {
          userId: user.id,
          fullName: profile?.fullName || null,
        },
      });
    }

    if (role === 'PRESTATAIRE' && profile) {
      await db.providerProfile.create({
        data: {
          userId: user.id,
          fullName: profile.fullName || '',
          email: profile.email || email || '',
          phone,
          photoUrl: profile.photo || null,
          sector: profile.sector || '',
          service: Array.isArray(profile.services) ? (profile.services[0] || '') : (profile.service || ''),
          province: profile.province || null,
          commune: profile.commune || null,
          description: profile.description || null,
          socialMedia: profile.socialMedia ? JSON.stringify(profile.socialMedia) : null,
          nationalScope: profile.nationalScope || false,
        },
      });
    }

    if (role === 'ENTREPRISE' && profile) {
      await db.companyProfile.create({
        data: {
          userId: user.id,
          companyName: profile.companyName || '',
          email: profile.email || email || '',
          phone,
          logoUrl: profile.logo || null,
          coverPhotoUrl: profile.coverPhoto || null,
          sector: profile.sector || '',
          companyType: profile.companyType || 'individuelle',
          employeeCount: profile.employeeCount || null,
          website: profile.website || null,
          fullAddress: profile.fullAddress || null,
          services: Array.isArray(profile.services) ? JSON.stringify(profile.services) : null,
          province: profile.province || null,
          commune: profile.commune || null,
          socialMedia: profile.socialMedia ? JSON.stringify(profile.socialMedia) : null,
          nationalScope: profile.nationalScope || false,
        },
      });
    }

    const token = createSession(user.id, user.role);

    return NextResponse.json({
      user: {
        id: user.id,
        phone: user.phone,
        email: user.email,
        role: user.role,
        status: user.status,
      },
      token,
    });
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json({ error: "Erreur lors de l'inscription" }, { status: 500 });
  }
}
