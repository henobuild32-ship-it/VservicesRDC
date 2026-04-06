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
      companyName: cp.companyName || null,
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
      createdAt: u.createdAt,
      profile: mapUserProfile(u),
    }));

    return NextResponse.json({ users: mappedUsers });
  } catch (error) {
    console.error('Admin users error:', error);
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

    await db.user.delete({ where: { id: userId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json({ error: 'Erreur' }, { status: 500 });
  }
}
