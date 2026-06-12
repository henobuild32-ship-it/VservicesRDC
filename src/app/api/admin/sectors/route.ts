import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    const session = getSession(token);
    if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });

    const setting = await db.platformSetting.findUnique({ where: { key: 'sectors' } });
    const sectors = setting ? JSON.parse(setting.value) : [];
    return NextResponse.json({ sectors });
  } catch (error) {
    console.error('Sectors fetch error:', error);
    return NextResponse.json({ error: 'Erreur' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    const session = getSession(token);
    if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });

    const body = await req.json();
    const { sectors } = body;

    if (!Array.isArray(sectors)) return NextResponse.json({ error: 'sectors doit être un tableau' }, { status: 400 });

    await db.platformSetting.upsert({
      where: { key: 'sectors' },
      update: { value: JSON.stringify(sectors) },
      create: { key: 'sectors', value: JSON.stringify(sectors) },
    });

    await db.adminAction.create({
      data: {
        adminId: session.userId,
        action: 'update_sectors',
        details: `Secteurs mis à jour (${sectors.length} secteurs)`,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Sectors update error:', error);
    return NextResponse.json({ error: 'Erreur' }, { status: 500 });
  }
}
