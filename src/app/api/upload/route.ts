import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    const session = getSession(token);
    if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string; // 'provider-photo', 'company-logo', 'company-cover'

    if (!file) return NextResponse.json({ error: 'Fichier requis' }, { status: 400 });

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const ext = file.name.split('.').pop() || 'jpg';
    const fileName = `${session.userId}-${type}-${Date.now()}.${ext}`;
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    await mkdir(uploadDir, { recursive: true });

    const filePath = path.join(uploadDir, fileName);
    await writeFile(filePath, buffer);

    const url = `/uploads/${fileName}`;

    // Update the appropriate profile
    if (type === 'provider-photo') {
      await db.providerProfile.update({
        where: { userId: session.userId },
        data: { photoUrl: url },
      });
    } else if (type === 'company-logo') {
      await db.companyProfile.update({
        where: { userId: session.userId },
        data: { logoUrl: url },
      });
    } else if (type === 'company-cover') {
      await db.companyProfile.update({
        where: { userId: session.userId },
        data: { coverPhotoUrl: url },
      });
    }

    return NextResponse.json({ url });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: "Erreur lors de l'upload" }, { status: 500 });
  }
}
