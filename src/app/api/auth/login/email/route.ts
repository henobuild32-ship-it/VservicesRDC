import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createSession } from '@/lib/session';
import { findUserByEmail, isValidEmail, verifyOtp } from '@/lib/otp';
import { clientIp, rateLimit } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  try {
    const ip = clientIp(req);
    if (!rateLimit(`login-email:${ip}`, 5)) {
      return NextResponse.json({ error: 'Trop de tentatives. Réessayez dans 1 minute.' }, { status: 429 });
    }

    const body = await req.json();
    const email = typeof body.email === 'string' ? body.email.trim() : '';
    const code = typeof body.code === 'string' ? body.code.trim() : '';

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: 'Adresse email invalide.' }, { status: 400 });
    }
    if (!/^\d{6}$/.test(code)) {
      return NextResponse.json({ error: 'Le code doit contenir 6 chiffres.' }, { status: 400 });
    }

    const user = await findUserByEmail(email);
    if (!user) {
      return NextResponse.json({ error: 'Aucun compte trouvé avec cet email.' }, { status: 404 });
    }

    const verified = await verifyOtp(user, code, 'login');
    if (!verified.ok) {
      return NextResponse.json({ error: verified.error }, { status: verified.status });
    }

    if (user.status === 'suspended') {
      return NextResponse.json(
        { error: "Votre compte a été suspendu. Contactez l'administration.", suspended: true },
        { status: 403 }
      );
    }

    const full = await db.user.findUnique({
      where: { id: user.id },
      include: { clientProfile: true, providerProfile: true, companyProfile: true },
    });

    const token = createSession(user.id, user.role);

    await db.userActivity.create({
      data: {
        userId: user.id,
        action: 'login',
        details: JSON.stringify({ ip, time: new Date().toISOString(), method: 'email_otp' }),
      },
    });

    return NextResponse.json({
      user: {
        id: full?.id,
        phone: full?.phone,
        email: full?.email,
        role: full?.role,
        status: full?.status,
        clientProfile: full?.clientProfile,
        providerProfile: full?.providerProfile,
        companyProfile: full?.companyProfile,
      },
      token,
    });
  } catch (error) {
    console.error('Email login error:', error);
    return NextResponse.json({ error: 'Erreur lors de la connexion.' }, { status: 500 });
  }
}
