import { v4 as uuidv4 } from 'uuid';

// Simple session store (in-memory for this app)
const sessions = new Map<string, { userId: string; role: string; expiresAt: number }>();

const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

export function createSession(userId: string, role: string): string {
  const token = uuidv4();
  sessions.set(token, {
    userId,
    role,
    expiresAt: Date.now() + SESSION_DURATION,
  });
  return token;
}

export function getSession(token: string): { userId: string; role: string } | null {
  const session = sessions.get(token);
  if (!session) return null;
  if (Date.now() > session.expiresAt) {
    sessions.delete(token);
    return null;
  }
  return { userId: session.userId, role: session.role };
}

export function deleteSession(token: string): void {
  sessions.delete(token);
}

export function cleanExpiredSessions(): void {
  const now = Date.now();
  for (const [token, session] of sessions.entries()) {
    if (now > session.expiresAt) {
      sessions.delete(token);
    }
  }
}
