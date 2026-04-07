// Stateless session tokens - no server-side storage needed
// Token is a base64 encoded JSON with userId, role, and expiration

const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

export function createSession(userId: string, role: string): string {
  const payload = JSON.stringify({
    u: userId,
    r: role,
    e: Date.now() + SESSION_DURATION,
  });
  return Buffer.from(payload).toString('base64url');
}

export function getSession(token: string): { userId: string; role: string } | null {
  try {
    const decoded = Buffer.from(token, 'base64url').toString('utf-8');
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
