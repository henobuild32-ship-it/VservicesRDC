import { NextRequest, NextResponse } from 'next/server';
import { findUserByEmail, issueOtp, isValidEmail, OtpPurpose } from '@/lib/otp';
import { maskEmail } from '@/lib/mailer';
import { clientIp, rateLimit } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  try {
    const ip = clientIp(req);
    if (!rateLimit(`otp:${ip}`, 5)) {
      return NextResponse.json({ error: 'Trop de demandes. Réessayez dans 1 minute.' }, { status: 429 });
    }

    const body = await req.json();
    const email = typeof body.email === 'string' ? body.email.trim() : '';
    const purpose: OtpPurpose = body.purpose === 'reset' ? 'reset' : 'login';

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: 'Adresse email invalide.' }, { status: 400 });
    }

    const user = await findUserByEmail(email);
    if (!user) {
      return NextResponse.json({ error: 'Aucun compte trouvé avec cet email.' }, { status: 404 });
    }

    const result = await issueOtp(user, purpose);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json({
      message: purpose === 'reset' ? 'Code de réinitialisation envoyé par email.' : 'Code de connexion envoyé par email.',
      sentTo: maskEmail(user.email as string),
      expiresIn: 600,
    });
  } catch (error) {
    console.error('OTP request error:', error);
    return NextResponse.json({ error: "Erreur lors de l'envoi du code." }, { status: 500 });
  }
}
