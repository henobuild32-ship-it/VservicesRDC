import { createHmac, timingSafeEqual } from 'crypto';

const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days
const SECRET = process.env.SESSION_SECRET || 'vservicerdc-dev-secret-change-in-prod-2024';

function sign(payload: string): string {
  return createHmac('sha256', SECRET).update(payload).digest('base64url');
}

export function createSession(userId: string, role: string): string {
  const payload = JSON.stringify({
    u: userId,
    r: role,
    e: Date.now() + SESSION_DURATION,
  });
  const encoded = Buffer.from(payload).toString('base64url');
  const sig = sign(encoded);
  return `${encoded}.${sig}`;
}

export function getSession(token: string): { userId: string; role: string } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    const [encoded, sig] = parts;
    const expectedSig = sign(encoded);
    if (sig.length !== expectedSig.length) return null;
    if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig))) return null;
    const decoded = Buffer.from(encoded, 'base64url').toString('utf-8');
    const data = JSON.parse(decoded);
    if (Date.now() > data.e) return null;
    return { userId: data.u, role: data.r };
  } catch {
    return null;
  }
}

export function deleteSession(_token: string): void {
  // Stateless - nothing to delete
}

export function cleanExpiredSessions(): void {
  // Stateless - nothing to clean
}
