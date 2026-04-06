import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';
import { hashPassword } from '@/lib/auth';

export async function PUT(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    const session = getSession(token);
    if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    const body = await req.json();

    if (session.role === 'CLIENT') {
      await db.clientProfile.update({
        where: { userId: session.userId },
        data: { fullName: body.fullName || undefined },
      });
      if (body.email) {
        await db.user.update({ where: { id: session.userId }, data: { email: body.email } });
      }
      return NextResponse.json({ success: true });
    }

    if (session.role === 'PRESTATAIRE') {
      await db.providerProfile.upsert({
        where: { userId: session.userId },
        create: {
          userId: session.userId,
          fullName: body.fullName,
          email: body.email,
          phone: body.phone,
          sector: body.sector,
          service: body.service,
          province: body.province,
          commune: body.commune,
          description: body.description,
          socialMedia: body.socialMedia ? JSON.stringify(body.socialMedia) : null,
          nationalScope: body.nationalScope || false,
        },
        update: {
          fullName: body.fullName,
          email: body.email,
          phone: body.phone,
          sector: body.sector,
          service: body.service,
          province: body.province,
          commune: body.commune,
          description: body.description,
          socialMedia: body.socialMedia ? JSON.stringify(body.socialMedia) : null,
          nationalScope: body.nationalScope || false,
        },
      });
      return NextResponse.json({ success: true });
    }

    if (session.role === 'ENTREPRISE') {
      await db.companyProfile.upsert({
        where: { userId: session.userId },
        create: {
          userId: session.userId,
          companyName: body.companyName,
          email: body.email,
          phone: body.phone,
          sector: body.sector,
          companyType: body.companyType,
          employeeCount: body.employeeCount,
          website: body.website,
          fullAddress: body.fullAddress,
          services: body.services ? JSON.stringify(body.services) : null,
          province: body.province,
          commune: body.commune,
          socialMedia: body.socialMedia ? JSON.stringify(body.socialMedia) : null,
          nationalScope: body.nationalScope || false,
        },
        update: {
          companyName: body.companyName,
          email: body.email,
          phone: body.phone,
          sector: body.sector,
          companyType: body.companyType,
          employeeCount: body.employeeCount,
          website: body.website,
          fullAddress: body.fullAddress,
          services: body.services ? JSON.stringify(body.services) : null,
          province: body.province,
          commune: body.commune,
          socialMedia: body.socialMedia ? JSON.stringify(body.socialMedia) : null,
          nationalScope: body.nationalScope || false,
        },
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Type de compte non supporté' }, { status: 400 });
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json({ error: 'Erreur lors de la mise à jour' }, { status: 500 });
  }
}

// Admin password change
export async function PATCH(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    const session = getSession(token);
    if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    const body = await req.json();
    if (session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    await db.user.update({
      where: { id: session.userId },
      data: { password: await hashPassword(body.newPassword) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Password change error:', error);
    return NextResponse.json({ error: 'Erreur' }, { status: 500 });
  }
}
