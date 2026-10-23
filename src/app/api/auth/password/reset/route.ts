import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import { createSession } from '@/lib/session';
import { findUserByEmail, isValidEmail, verifyOtp } from '@/lib/otp';
import { clientIp, rateLimit } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  try {
    const ip = clientIp(req);
    if (!rateLimit(`password-reset:${ip}`, 5)) {
      return NextResponse.json({ error: 'Trop de tentatives. Réessayez dans 1 minute.' }, { status: 429 });
    }

    const body = await req.json();
    const email = typeof body.email === 'string' ? body.email.trim() : '';
    const code = typeof body.code === 'string' ? body.code.trim() : '';
    const newPassword = typeof body.newPassword === 'string' ? body.newPassword : '';

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: 'Adresse email invalide.' }, { status: 400 });
    }
    if (!/^\d{6}$/.test(code)) {
      return NextResponse.json({ error: 'Le code doit contenir 6 chiffres.' }, { status: 400 });
    }
    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'Le nouveau mot de passe doit contenir au moins 6 caractères.' }, { status: 400 });
    }

    const user = await findUserByEmail(email);
    if (!user) {
      return NextResponse.json({ error: 'Aucun compte trouvé avec cet email.' }, { status: 404 });
    }

    const verified = await verifyOtp(user, code, 'reset');
    if (!verified.ok) {
      return NextResponse.json({ error: verified.error }, { status: verified.status });
    }

    if (user.status === 'suspended') {
      return NextResponse.json(
        { error: "Votre compte a été suspendu. Contactez l'administration.", suspended: true },
        { status: 403 }
      );
    }

    await db.user.update({
      where: { id: user.id },
      data: { password: await hashPassword(newPassword) },
    });

    await db.userActivity.create({
      data: {
        userId: user.id,
        action: 'password_reset',
        details: JSON.stringify({ ip, time: new Date().toISOString() }),
      },
    });

    const token = createSession(user.id, user.role);

    return NextResponse.json({
      message: 'Mot de passe réinitialisé avec succès.',
      user: { id: user.id, phone: user.phone, email: user.email, role: user.role, status: user.status },
      token,
    });
  } catch (error) {
    console.error('Password reset error:', error);
    return NextResponse.json({ error: 'Erreur lors de la réinitialisation.' }, { status: 500 });
  }
}
