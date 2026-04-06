import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import { createSession } from '@/lib/session';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phone, password, role, email } = body;

    if (!phone || !password || !role) {
      return NextResponse.json({ error: 'Téléphone, mot de passe et type de compte sont requis' }, { status: 400 });
    }

    if (!['CLIENT', 'PRESTATAIRE', 'ENTREPRISE'].includes(role)) {
      return NextResponse.json({ error: 'Type de compte invalide' }, { status: 400 });
    }

    const existing = await db.user.findUnique({ where: { phone } });
    if (existing) {
      return NextResponse.json({ error: 'Ce numéro de téléphone est déjà utilisé' }, { status: 400 });
    }

    const hashedPassword = await hashPassword(password);
    const status = role === 'CLIENT' ? 'approved' : 'pending';

    const user = await db.user.create({
      data: {
        phone,
        password: hashedPassword,
        email: email || null,
        role,
        status,
      },
    });

    if (role === 'CLIENT') {
      await db.clientProfile.create({
        data: { userId: user.id },
      });
    }

    const token = createSession(user.id, user.role);

    return NextResponse.json({
      user: {
        id: user.id,
        phone: user.phone,
        email: user.email,
        role: user.role,
        status: user.status,
      },
      token,
    });
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json({ error: "Erreur lors de l'inscription" }, { status: 500 });
  }
}
