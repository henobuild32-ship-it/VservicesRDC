import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const province = searchParams.get('province');
    const commune = searchParams.get('commune');
    const sector = searchParams.get('sector');
    const service = searchParams.get('service');
    const query = searchParams.get('query');
    const type = searchParams.get('type'); // "PRESTATAIRE" or "ENTREPRISE" or "all"
    const userId = searchParams.get('userId'); // get specific user

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
        ? user.reviewsReceived.reduce((sum, r) => sum + r.rating, 0) / user.reviewsReceived.length
        : null;

      return NextResponse.json({
        user: {
          id: user.id,
          phone: user.phone,
          email: user.email,
          role: user.role,
          providerProfile: user.providerProfile,
          companyProfile: user.companyProfile,
        },
        reviews: user.reviewsReceived,
        avgRating,
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

    // Filter in memory (SQLite limitations)
    let results = users.map(user => {
      const profile = user.role === 'PRESTATAIRE' ? user.providerProfile : user.companyProfile;
      const avgRating = user.reviewsReceived.length > 0
        ? user.reviewsReceived.reduce((sum, r) => sum + r.rating, 0) / user.reviewsReceived.length
        : null;

      return {
        id: user.id,
        phone: user.phone,
        email: user.email,
        role: user.role,
        providerProfile: user.providerProfile,
        companyProfile: user.companyProfile,
        avgRating: avgRating ? Math.round(avgRating * 10) / 10 : null,
        reviewCount: user.reviewsReceived.length,
      };
    });

    // Apply filters
    if (province) {
      results = results.filter(r => {
        const p = r.role === 'PRESTATAIRE' ? r.providerProfile?.province : r.companyProfile?.province;
        return p === province;
      });
    }
    if (commune) {
      results = results.filter(r => {
        const c = r.role === 'PRESTATAIRE' ? r.providerProfile?.commune : r.companyProfile?.commune;
        return c === commune;
      });
    }
    if (sector) {
      results = results.filter(r => {
        const s = r.role === 'PRESTATAIRE' ? r.providerProfile?.sector : r.companyProfile?.sector;
        return s === sector;
      });
    }
    if (service) {
      results = results.filter(r => {
        if (r.role === 'PRESTATAIRE') {
          return r.providerProfile?.service === service;
        } else {
          const services = r.companyProfile?.services;
          if (services) {
            try {
              const parsed = JSON.parse(services);
              return parsed.includes(service);
            } catch {
              return services.includes(service);
            }
          }
          return false;
        }
      });
    }
    if (query) {
      const q = query.toLowerCase();
      results = results.filter(r => {
        const profile = r.role === 'PRESTATAIRE' ? r.providerProfile : r.companyProfile;
        const name = r.role === 'PRESTATAIRE' ? profile?.fullName : profile?.companyName;
        const desc = profile?.description || '';
        return (name && name.toLowerCase().includes(q)) || desc.toLowerCase().includes(q);
      });
    }

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Providers search error:', error);
    return NextResponse.json({ error: 'Erreur de recherche' }, { status: 500 });
  }
}
