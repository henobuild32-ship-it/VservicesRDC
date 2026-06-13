import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

function generateSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'user';
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    // Try provider first
    let provider = await db.providerProfile.findFirst({ where: { slug }, include: { user: { select: { id: true, phone: true, status: true, certified: true } } } });
    if (provider) {
      let services: string[] = [];
      if (provider.services) { try { services = JSON.parse(provider.services); } catch { services = []; } }
      if (services.length === 0 && provider.service) services = [provider.service];
      let socialMedia = null;
      if (provider.socialMedia) { try { socialMedia = JSON.parse(provider.socialMedia); } catch {} }
      return NextResponse.json({ type: 'PRESTATAIRE', id: provider.userId, phone: provider.user.phone, status: provider.user.status, certified: provider.user.certified, profile: { fullName: provider.fullName, photo: provider.photoUrl, sector: provider.sector, services, province: provider.province, commune: provider.commune, nationalScope: provider.nationalScope, description: provider.description, socialMedia } });
    }
    // Try company
    let company = await db.companyProfile.findFirst({ where: { slug }, include: { user: { select: { id: true, phone: true, status: true, certified: true } }, employees: { where: { isManager: true } } } });
    if (company) {
      let services: string[] = [];
      if (company.services) { try { services = JSON.parse(company.services); } catch { services = []; } }
      let socialMedia = null;
      if (company.socialMedia) { try { socialMedia = JSON.parse(company.socialMedia); } catch {} }
      return NextResponse.json({ type: 'ENTREPRISE', id: company.userId, phone: company.user.phone, status: company.user.status, certified: company.user.certified, profile: { companyName: company.companyName, logo: company.logoUrl, coverPhoto: company.coverPhotoUrl, sector: company.sector, services, province: company.province, commune: company.commune, nationalScope: company.nationalScope, description: company.description, website: company.website, fullAddress: company.fullAddress, socialMedia, employeeCount: company.employeeCount, manager: company.employees[0] || null } });
    }
    // Try by user ID as fallback
    let user = await db.user.findUnique({ where: { id: slug }, include: { providerProfile: true, companyProfile: true } });
    if (!user) return NextResponse.json({ error: 'Profil non trouvé' }, { status: 404 });
    if (user.providerProfile) {
      const p = user.providerProfile;
      let services: string[] = [];
      if (p.services) { try { services = JSON.parse(p.services); } catch { services = []; } }
      if (services.length === 0 && p.service) services = [p.service];
      let socialMedia = null;
      if (p.socialMedia) { try { socialMedia = JSON.parse(p.socialMedia); } catch {} }
      return NextResponse.json({ type: 'PRESTATAIRE', id: user.id, phone: user.phone, status: user.status, certified: user.certified, profile: { fullName: p.fullName, photo: p.photoUrl, sector: p.sector, services, province: p.province, commune: p.commune, nationalScope: p.nationalScope, description: p.description, socialMedia } });
    }
    if (user.companyProfile) {
      const c = user.companyProfile;
      let services: string[] = [];
      if (c.services) { try { services = JSON.parse(c.services); } catch { services = []; } }
      let socialMedia = null;
      if (c.socialMedia) { try { socialMedia = JSON.parse(c.socialMedia); } catch {} }
      return NextResponse.json({ type: 'ENTREPRISE', id: user.id, phone: user.phone, status: user.status, certified: user.certified, profile: { companyName: c.companyName, logo: c.logoUrl, coverPhoto: c.coverPhotoUrl, sector: c.sector, services, province: c.province, commune: c.commune, nationalScope: c.nationalScope, description: c.description, website: c.website, fullAddress: c.fullAddress, socialMedia, employeeCount: c.employeeCount } });
    }
    return NextResponse.json({ error: 'Profil non trouvé' }, { status: 404 });
  } catch (error) {
    console.error('Public profile error:', error);
    return NextResponse.json({ error: 'Erreur' }, { status: 500 });
  }
}
