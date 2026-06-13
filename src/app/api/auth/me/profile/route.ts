import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';
import { hashPassword } from '@/lib/auth';

function makeSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'user';
}

export async function PUT(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    const session = getSession(token);
    if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    const body = await req.json();

    // Update email on User if provided
    if (body.email) {
      await db.user.update({ where: { id: session.userId }, data: { email: body.email } });
    }

    // Update auto-reply message if provided
    if (body.autoReplyMessage !== undefined) {
      await db.user.update({ where: { id: session.userId }, data: { autoReplyMessage: body.autoReplyMessage || null } });
    }

    if (session.role === 'CLIENT') {
      await db.clientProfile.update({
        where: { userId: session.userId },
        data: {
          fullName: body.fullName || undefined,
          email: body.email || undefined,
        },
      });
      return NextResponse.json({ success: true });
    }

    if (session.role === 'PRESTATAIRE') {
      const serviceValue = Array.isArray(body.services) && body.services.length > 0 ? body.services[0] : '';
      const servicesJson = Array.isArray(body.services) && body.services.length > 0 ? JSON.stringify(body.services) : null;
      const existingP = await db.providerProfile.findUnique({ where: { userId: session.userId } });
      const pSlug = body.fullName && body.fullName !== existingP?.fullName ? makeSlug(body.fullName) + '-' + session.userId.slice(0, 6) : undefined;
      await db.userActivity.create({
        data: { userId: session.userId, action: 'profile_update', details: JSON.stringify({ role: session.role, time: new Date().toISOString() }) },
      });
      await db.providerProfile.upsert({
        where: { userId: session.userId },
        create: {
          userId: session.userId,
          fullName: body.fullName || '',
          email: body.email || '',
          phone: body.phone || '',
          slug: body.fullName ? makeSlug(body.fullName) + '-' + session.userId.slice(0, 6) : 'provider-' + session.userId.slice(0, 8),
          sector: body.sector || '',
          service: serviceValue,
          services: servicesJson,
          province: body.province || null,
          commune: body.commune || null,
          description: body.description || null,
          experience: body.experience || null,
          availability: body.availability || null,
          socialMedia: body.socialMedia ? JSON.stringify(body.socialMedia) : null,
          nationalScope: body.nationalScope || false,
        },
        update: {
          fullName: body.fullName || '',
          email: body.email || '',
          phone: body.phone || '',
          ...(pSlug ? { slug: pSlug } : {}),
          sector: body.sector || '',
          service: serviceValue,
          services: servicesJson,
          province: body.province || null,
          commune: body.commune || null,
          description: body.description || null,
          experience: body.experience !== undefined ? body.experience : undefined,
          availability: body.availability !== undefined ? body.availability : undefined,
          socialMedia: body.socialMedia ? JSON.stringify(body.socialMedia) : null,
          nationalScope: body.nationalScope || false,
        },
      });
      return NextResponse.json({ success: true });
    }

    if (session.role === 'ENTREPRISE') {
      const existingC = await db.companyProfile.findUnique({ where: { userId: session.userId } });
      const eSlug = body.companyName && body.companyName !== existingC?.companyName ? makeSlug(body.companyName) + '-' + session.userId.slice(0, 6) : undefined;
      await db.companyProfile.upsert({
        where: { userId: session.userId },
        create: {
          userId: session.userId,
          companyName: body.companyName || '',
          email: body.email || '',
          phone: body.phone || '',
          slug: body.companyName ? makeSlug(body.companyName) + '-' + session.userId.slice(0, 6) : 'company-' + session.userId.slice(0, 8),
          sector: body.sector || '',
          companyType: body.companyType || 'individuelle',
          employeeCount: body.employeeCount || null,
          hasEmployees: body.hasEmployees || false,
          website: body.website || null,
          fullAddress: body.fullAddress || null,
          description: body.description || null,
          services: body.services ? JSON.stringify(body.services) : null,
          province: body.province || null,
          commune: body.commune || null,
          socialMedia: body.socialMedia ? JSON.stringify(body.socialMedia) : null,
          nationalScope: body.nationalScope || false,
        },
        update: {
          companyName: body.companyName || '',
          email: body.email || '',
          phone: body.phone || '',
          ...(eSlug ? { slug: eSlug } : {}),
          sector: body.sector || '',
          companyType: body.companyType || 'individuelle',
          employeeCount: body.employeeCount || null,
          hasEmployees: body.hasEmployees !== undefined ? body.hasEmployees : undefined,
          website: body.website || null,
          fullAddress: body.fullAddress || null,
          description: body.description || null,
          services: body.services ? JSON.stringify(body.services) : null,
          province: body.province || null,
          commune: body.commune || null,
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

// Password change for all users
export async function PATCH(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    const session = getSession(token);
    if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    const body = await req.json();
    if (!body.newPassword || body.newPassword.length < 6) {
      return NextResponse.json({ error: 'Mot de passe trop court (min 6 caractères)' }, { status: 400 });
    }

    await db.user.update({
      where: { id: session.userId },
      data: { password: await hashPassword(body.newPassword) },
    });

    await db.userActivity.create({
      data: { userId: session.userId, action: 'password_change', details: JSON.stringify({ time: new Date().toISOString() }) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Password change error:', error);
    return NextResponse.json({ error: 'Erreur' }, { status: 500 });
  }
}
