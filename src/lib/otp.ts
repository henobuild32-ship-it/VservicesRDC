import { createHmac, randomInt, timingSafeEqual } from 'crypto';
import { db } from '@/lib/db';
import { sendOtpEmail } from '@/lib/mailer';

export const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
export const OTP_MAX_ATTEMPTS = 5;
export const OTP_RESEND_COOLDOWN_MS = 60 * 1000; // 1 minute entre 2 envois

export type OtpPurpose = 'login' | 'reset';

function otpSecret(): string {
  return process.env.SESSION_SECRET || 'vservicerdc-dev-secret-change-in-prod-2024';
}

function hashOtp(code: string): string {
  return createHmac('sha256', `${otpSecret()}:otp`).update(code).digest('hex');
}

export function generateOtpCode(): string {
  return randomInt(0, 1000000).toString().padStart(6, '0');
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
}

export function findUserByEmail(email: string) {
  return db.user.findFirst({
    where: { email: { equals: email.trim(), mode: 'insensitive' } },
  });
}

type IssueResult =
  | { ok: true; code: string }
  | { ok: false; status: number; error: string };

export async function issueOtp(
  user: { id: string; email: string | null; status: string; emailOtpSentAt: Date | null },
  purpose: OtpPurpose
): Promise<IssueResult> {
  if (!user.email) {
    return { ok: false, status: 400, error: 'Aucune adresse email associée à ce compte.' };
  }
  if (user.status === 'suspended') {
    return { ok: false, status: 403, error: "Votre compte a été suspendu. Contactez l'administration." };
  }
  if (user.emailOtpSentAt && Date.now() - user.emailOtpSentAt.getTime() < OTP_RESEND_COOLDOWN_MS) {
    const wait = Math.ceil((OTP_RESEND_COOLDOWN_MS - (Date.now() - user.emailOtpSentAt.getTime())) / 1000);
    return { ok: false, status: 429, error: `Code déjà envoyé. Renvoyez dans ${wait} seconde(s).` };
  }

  const code = generateOtpCode();
  await db.user.update({
    where: { id: user.id },
    data: {
      emailOtpHash: hashOtp(code),
      emailOtpPurpose: purpose,
      emailOtpExpiresAt: new Date(Date.now() + OTP_TTL_MS),
      emailOtpAttempts: 0,
      emailOtpSentAt: new Date(),
    },
  });

  try {
    await sendOtpEmail(user.email, code, purpose);
  } catch (err) {
    console.error('SMTP error:', err);
    return { ok: false, status: 502, error: "Impossible d'envoyer l'email. Réessayez plus tard." };
  }

  return { ok: true, code };
}

type VerifyResult = { ok: true } | { ok: false; status: number; error: string };

export async function verifyOtp(
  user: {
    id: string;
    status: string;
    emailOtpHash: string | null;
    emailOtpPurpose: string | null;
    emailOtpExpiresAt: Date | null;
    emailOtpAttempts: number;
  },
  code: string,
  purpose: OtpPurpose
): Promise<VerifyResult> {
  const clean = code.trim();

  if (!user.emailOtpHash || user.emailOtpPurpose !== purpose) {
    return { ok: false, status: 400, error: 'Aucun code en cours. Demandez un nouveau code.' };
  }
  if (!user.emailOtpExpiresAt || user.emailOtpExpiresAt.getTime() < Date.now()) {
    await clearOtp(user.id);
    return { ok: false, status: 400, error: 'Code expiré. Demandez un nouveau code.' };
  }
  if (user.emailOtpAttempts >= OTP_MAX_ATTEMPTS) {
    await clearOtp(user.id);
    return { ok: false, status: 429, error: 'Trop de tentatives. Demandez un nouveau code.' };
  }

  const expected = Buffer.from(user.emailOtpHash, 'hex');
  const provided = Buffer.from(hashOtp(clean), 'hex');
  const matches =
    expected.length === provided.length && timingSafeEqual(expected, provided);

  if (!matches) {
    await db.user.update({
      where: { id: user.id },
      data: { emailOtpAttempts: { increment: 1 } },
    });
    return { ok: false, status: 401, error: 'Code incorrect.' };
  }

  await clearOtp(user.id);
  return { ok: true };
}

export async function clearOtp(userId: string): Promise<void> {
  await db.user.update({
    where: { id: userId },
    data: {
      emailOtpHash: null,
      emailOtpPurpose: null,
      emailOtpExpiresAt: null,
      emailOtpAttempts: 0,
      emailOtpSentAt: null,
    },
  });
}
