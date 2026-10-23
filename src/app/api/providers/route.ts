import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';

type SearchableProfile = {
  fullName?: string | null;
  companyName?: string | null;
  sector?: string | null;
  services?: string[] | null;
  description?: string | null;
};

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('fr')
    .trim();
}

function editDistanceAtMost(left: string, right: string, limit: number): boolean {
  if (Math.abs(left.length - right.length) > limit) return false;

  let previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let row = 1; row <= left.length; row += 1) {
    const current = [row];
    let rowMinimum = row;
    for (let column = 1; column <= right.length; column += 1) {
      const cost = left[row - 1] === right[column - 1] ? 0 : 1;
      current[column] = Math.min(
        current[column - 1] + 1,
        previous[column] + 1,
        previous[column - 1] + cost,
      );
      rowMinimum = Math.min(rowMinimum, current[column]);
    }
    if (rowMinimum > limit) return false;
    previous = current;
  }
  return previous[right.length] <= limit;
}

function mapProviderProfile(user: any) {
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
      logo: null,
      sector: pp.sector || null,
      services: pp.services ? (() => { try { return JSON.parse(pp.services); } catch { return pp.service ? [pp.service] : []; } })() : (pp.service ? [pp.service] : []),
      province: pp.province || null,
      commune: pp.commune || null,
      nationalScope: pp.nationalScope || false,
      description: pp.description || null,
      experience: pp.experience || null,
      availability: pp.availability || null,
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
      certified: user.certified || false,
      fullName: null,
      photo: null,
      logo: cp.logoUrl || null,
      coverPhoto: cp.coverPhotoUrl || null,
      sector: cp.sector || null,
      services,
      province: cp.province || null,
      commune: cp.commune || null,
      nationalScope: cp.nationalScope || false,
      description: cp.description || null,
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

function queryScore(profile: SearchableProfile, query: string): number | null {
  const name = normalize(profile.fullName || profile.companyName || '');
  const services = (profile.services || []).map(normalize);
  const sector = normalize(profile.sector || '');
  const description = normalize(profile.description || '');
  const fields = [name, sector, ...services, description].filter(Boolean);
  const words = fields.flatMap((field) => field.split(/[^\p{L}\p{N}]+/u).filter(Boolean));
  const tokens = normalize(query).split(/[^\p{L}\p{N}]+/u).filter(Boolean);
  let score = 0;

  for (const token of tokens) {
    const nameMatch = name.includes(token);
    const serviceMatch = services.some((service) => service.includes(token));
    const sectorMatch = sector.includes(token);
    const descriptionMatch = description.includes(token);
    const typoMatch = token.length >= 4 && words.some((word) =>
      editDistanceAtMost(token, word, token.length >= 9 ? 2 : 1),
    );

    if (!nameMatch && !serviceMatch && !sectorMatch && !descriptionMatch && !typoMatch) return null;
    score += nameMatch ? 8 : serviceMatch ? 6 : sectorMatch ? 5 : descriptionMatch ? 2 : 1;
  }

  if (tokens.length > 0 && name === normalize(query)) score += 10;
  return score;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const province = searchParams.get('province');
    const commune = searchParams.get('commune');
    const sector = searchParams.get('sector');
    const service = searchParams.get('service');
    const query = searchParams.get('query')?.trim() || '';
    const requestedRole = searchParams.get('role') || searchParams.get('type');
    const userId = searchParams.get('userId');
    const pageValue = Number(searchParams.get('page') || '1');
    const limitValue = Number(searchParams.get('limit') || '20');
    const page = Number.isSafeInteger(pageValue) && pageValue > 0 ? pageValue : 1;
    const limit = Number.isSafeInteger(limitValue) ? Math.min(50, Math.max(1, limitValue)) : 20;
    const minRatingValue = searchParams.get('minRating');
    const minRating = minRatingValue === null ? null : Number(minRatingValue);
    const verified = searchParams.get('verified');

    if (requestedRole && !['all', 'PRESTATAIRE', 'ENTREPRISE'].includes(requestedRole)) {
      return NextResponse.json({ error: 'Type de profil invalide' }, { status: 400 });
    }
    if (minRating !== null && (!Number.isFinite(minRating) || minRating < 0 || minRating > 5)) {
      return NextResponse.json({ error: 'Note minimale invalide' }, { status: 400 });
    }

    if (userId) {
      const user = await db.user.findUnique({
        where: { id: userId },
        include: {
          providerProfile: true,
          companyProfile: true,
          reviewsReceived: {
            where: { hidden: false },
            include: { author: { select: { id: true, clientProfile: { select: { fullName: true } } } } },
          },
        },
      });

      if (!user) {
        return NextResponse.json({ error: 'Non trouvé' }, { status: 404 });
      }

      const avgRating = user.reviewsReceived.length > 0
        ? user.reviewsReceived.reduce((sum, review) => sum + review.rating, 0) / user.reviewsReceived.length
        : null;
      const reviews = user.reviewsReceived.map((review) => ({
        id: review.id,
        authorName: review.author?.clientProfile?.fullName || 'Anonyme',
        rating: review.rating,
        comment: review.comment || '',
        createdAt: review.createdAt,
      }));

      return NextResponse.json({
        id: user.id,
        phone: user.phone,
        email: user.email,
        role: user.role,
        status: user.status,
        certified: user.certified || false,
        autoReplyMessage: user.autoReplyMessage || null,
        profile: mapProviderProfile(user),
        reviews,
        avgRating: avgRating === null ? 0 : Math.round(avgRating * 10) / 10,
        reviewCount: user.reviewsReceived.length,
      });
    }

    const token = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
    const session = token ? getSession(token) : null;
    const where: Record<string, unknown> = {
      status: 'approved',
      role: requestedRole && requestedRole !== 'all'
        ? requestedRole
        : { in: ['PRESTATAIRE', 'ENTREPRISE'] },
      ...(session ? { id: { not: session.userId } } : {}),
    };

    const users = await db.user.findMany({
      where,
      include: {
        providerProfile: true,
        companyProfile: true,
        reviewsReceived: {
          where: { hidden: false },
          select: { rating: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    let results = users.map((user) => {
      const profile = mapProviderProfile(user);
      const avgRating = user.reviewsReceived.length > 0
        ? user.reviewsReceived.reduce((sum, review) => sum + review.rating, 0) / user.reviewsReceived.length
        : null;
      return {
        id: user.id,
        phone: user.phone,
        email: user.email,
        role: user.role,
        status: user.status,
        certified: user.certified || false,
        profile,
        avgRating: avgRating === null ? null : Math.round(avgRating * 10) / 10,
        reviewCount: user.reviewsReceived.length,
        createdAt: user.createdAt,
        score: query ? queryScore(profile, query) : 0,
      };
    }).filter((result) => result.score !== null);

    if (province) results = results.filter((result) => normalize(result.profile?.province || '') === normalize(province));
    if (commune) results = results.filter((result) => normalize(result.profile?.commune || '') === normalize(commune));
    if (sector) results = results.filter((result) => normalize(result.profile?.sector || '').includes(normalize(sector)));
    if (service) {
      results = results.filter((result) =>
        (result.profile?.services || []).some((item: string) => normalize(item).includes(normalize(service))),
      );
    }
    if (verified === 'true') results = results.filter((result) => result.certified);
    if (verified === 'false') results = results.filter((result) => !result.certified);
    if (minRating !== null) results = results.filter((result) => (result.avgRating || 0) >= minRating);

    results.sort((left, right) =>
      (right.score || 0) - (left.score || 0)
      || (right.avgRating || 0) - (left.avgRating || 0)
      || right.createdAt.getTime() - left.createdAt.getTime(),
    );

    const total = results.length;
    const totalPages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    const paged = results.slice(start, start + limit).map(({ createdAt: _createdAt, score: _score, ...result }) => result);

    return NextResponse.json(
      { results: paged, total, totalPages, page, limit },
      { headers: { Vary: 'Authorization' } },
    );
  } catch (error) {
    console.error('Providers search error:', error);
    return NextResponse.json({ error: 'Erreur de recherche' }, { status: 500 });
  }
}
