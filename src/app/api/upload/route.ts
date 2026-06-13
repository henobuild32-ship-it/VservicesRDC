import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';

async function resizeImage(buffer: Buffer, maxWidth: number): Promise<Buffer> {
  try {
    const sharp = (await import('sharp')).default;
    return await sharp(buffer).resize({ width: maxWidth, withoutEnlargement: true }).jpeg({ quality: 80 }).toBuffer();
  } catch { return buffer; }
}

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    const session = getSession(token);
    if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string;
    if (!file) return NextResponse.json({ error: 'Fichier requis' }, { status: 400 });
    const bytes = await file.arrayBuffer();
    const buf = Buffer.from(bytes);
    const maxWidth = type === 'provider-photo' || type === 'company-logo' || type === 'employee-photo' ? 400 : 800;
    const resized = await resizeImage(buf, maxWidth);
    const mimeType = file.type || 'image/jpeg';
    const base64 = resized.toString('base64');
    const dataUrl = `data:${mimeType};base64,${base64}`;
    if (type === 'provider-photo') {
      await db.providerProfile.update({ where: { userId: session.userId }, data: { photoUrl: dataUrl } });
    } else if (type === 'company-logo') {
      await db.companyProfile.update({ where: { userId: session.userId }, data: { logoUrl: dataUrl } });
    } else if (type === 'company-cover') {
      await db.companyProfile.update({ where: { userId: session.userId }, data: { coverPhotoUrl: dataUrl } });
    } else if (type === 'document') {
      const existing = await db.companyProfile.findUnique({ where: { userId: session.userId } });
      let docs: string[] = [];
      if (existing?.documents) { try { docs = JSON.parse(existing.documents); } catch { docs = []; } }
      docs.push(dataUrl);
      await db.companyProfile.update({ where: { userId: session.userId }, data: { documents: JSON.stringify(docs) } });
    } else if (type === 'employee-photo') {
      const empId = formData.get('employeeId') as string;
      if (empId) await db.employee.update({ where: { id: empId }, data: { photoUrl: dataUrl } });
    }
    return NextResponse.json({ url: dataUrl });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: "Erreur lors de l'upload" }, { status: 500 });
  }
}
