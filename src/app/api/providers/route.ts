import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

function mapProviderProfile(user: any) {
  if (user.role === 'PRESTATAIRE' && user.providerProfile) {
    const pp = user.providerProfile;
    let socialMedia = null;
    if (pp.socialMedia) {
      try { socialMedia = JSON.parse(pp.socialMedia); } catch { socialMedia = null; }
    }
    return {
      fullName: pp.fullName || null,
      photo: pp.photoUrl || null,
      logo: null,
      sector: pp.sector || null,
      services: pp.services ? (() => { try { return JSON.parse(pp.services); } catch { return pp.service ? [pp.service] : []; } })() : (pp.service ? [pp.service] : []),
      province: pp.province || null,
      commune: pp.commune || null,
      nationalScope: pp.nationalScope || false,
      description: pp.description || null,
      website: null,
      socialMedia,
      companyType: null,
      employeeCount: null,
      fullAddress: null,
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
      fullName: null,
      photo: null,
      logo: cp.logoUrl || null,
      coverPhoto: cp.coverPhotoUrl || null,
      sector: cp.sector || null,
      services,
      province: cp.province || null,
      commune: cp.commune || null,
      nationalScope: cp.nationalScope || false,
      description: null,
      website: cp.website || null,
      socialMedia,
      companyName: cp.companyName || null,
      companyType: cp.companyType || null,
      employeeCount: cp.employeeCount || null,
      fullAddress: cp.fullAddress || null,
    };
  }
  return {};
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const province = searchParams.get('province');
    const commune = searchParams.get('commune');
    const sector = searchParams.get('sector');
    const service = searchParams.get('service');
    const query = searchParams.get('query');
    const type = searchParams.get('type');
    const role = searchParams.get('role');
    const userId = searchParams.get('userId');

    if (userId) {
      // Get a specific provider/company
      const user = await db.user.findUnique({
        where: { id: userId },
        include: {
          providerProfile: true,
          companyProfile: true,
          reviewsReceived: {
            include: { author: { select: { id: true, clientProfile: { select: { fullName: true } } } } },
          },
        },
      });

      if (!user) {
        return NextResponse.json({ error: 'Non trouvé' }, { status: 404 });
      }

      const avgRating = user.reviewsReceived.length > 0
        ? user.reviewsReceived.reduce((sum: number, r: any) => sum + r.rating, 0) / user.reviewsReceived.length
        : null;

      const reviews = user.reviewsReceived.map((r: any) => ({
        id: r.id,
        authorName: r.author?.clientProfile?.fullName || 'Anonyme',
        rating: r.rating,
        comment: r.comment || '',
        createdAt: r.createdAt,
      }));

      return NextResponse.json({
        id: user.id,
        phone: user.phone,
        email: user.email,
        role: user.role,
        status: user.status,
        autoReplyMessage: user.autoReplyMessage || null,
        profile: mapProviderProfile(user),
        reviews,
        avgRating: avgRating ? Math.round(avgRating * 10) / 10 : 0,
        reviewCount: user.reviewsReceived.length,
      });
    }

    // Search providers and companies
    const where: Record<string, unknown> = {
      status: 'approved',
      role: { in: ['PRESTATAIRE', 'ENTREPRISE'] },
    };

    if (type && type !== 'all') {
      where.role = type;
    }
    if (role && role !== 'all' && role !== '') {
      where.role = role;
    }

    const users = await db.user.findMany({
      where,
      include: {
        providerProfile: true,
        companyProfile: true,
        reviewsReceived: {
          select: { rating: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    // Map to unified format
    let results = users.map(user => {
      const avgRating = user.reviewsReceived.length > 0
        ? user.reviewsReceived.reduce((sum: number, r: any) => sum + r.rating, 0) / user.reviewsReceived.length
        : null;

      return {
        id: user.id,
        phone: user.phone,
        email: user.email,
        role: user.role,
        status: user.status,
        profile: mapProviderProfile(user),
        avgRating: avgRating ? Math.round(avgRating * 10) / 10 : null,
        reviewCount: user.reviewsReceived.length,
      };
    });

    // Apply filters using profile data
    if (province) {
      results = results.filter(r => r.profile?.province === province);
    }
    if (commune) {
      results = results.filter(r => r.profile?.commune === commune);
    }
    if (sector) {
      results = results.filter(r => r.profile?.sector === sector);
    }
    if (service) {
      results = results.filter(r => {
        const services = r.profile?.services || [];
        return services.includes(service);
      });
    }
    if (query) {
      const q = query.toLowerCase();
      results = results.filter(r => {
        const name = r.profile?.companyName || r.profile?.fullName || '';
        const desc = r.profile?.description || '';
        return (name && name.toLowerCase().includes(q)) || desc.toLowerCase().includes(q);
      });
    }

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Providers search error:', error);
    return NextResponse.json({ error: 'Erreur de recherche' }, { status: 500 });
  }
}
