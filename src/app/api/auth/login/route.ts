import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyPassword, hashPassword, ADMIN_DEFAULT_PASSWORD } from '@/lib/auth';
import { createSession } from '@/lib/session';

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 60000 });
    return true;
  }
  if (entry.count >= 5) return false;
  entry.count++;
  return true;
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    if (!checkRateLimit(ip)) {
      return NextResponse.json({ error: 'Trop de tentatives. Réessayez dans 1 minute.' }, { status: 429 });
    }

    const body = await req.json();
    const { phone, password, isAdmin, adminPassword } = body;

    // Admin-only login: only adminPassword field
    if (isAdmin && adminPassword) {
      if (adminPassword !== ADMIN_DEFAULT_PASSWORD) {
        return NextResponse.json({ error: 'Mot de passe administrateur incorrect' }, { status: 401 });
      }
      // Find or create admin user
      let admin = await db.user.findFirst({ where: { role: 'ADMIN' } });
      if (!admin) {
        admin = await db.user.create({
          data: {
            phone: '+243000000000',
            password: await hashPassword(ADMIN_DEFAULT_PASSWORD),
            role: 'ADMIN',
            status: 'approved',
          },
        });
      }
      const token = createSession(admin.id, 'ADMIN');
      return NextResponse.json({
        user: {
          id: admin.id,
          phone: admin.phone,
          role: 'ADMIN',
          status: 'approved',
        },
        token,
      });
    }

    // Regular user login
    if (!phone || !password) {
      return NextResponse.json({ error: 'Téléphone et mot de passe sont requis' }, { status: 400 });
    }

    const user = await db.user.findUnique({
      where: { phone },
      include: {
        clientProfile: true,
        providerProfile: true,
        companyProfile: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Aucun compte trouvé avec ce numéro' }, { status: 401 });
    }

    const valid = await verifyPassword(password, user.password);
    if (!valid) {
      return NextResponse.json({ error: 'Mot de passe incorrect' }, { status: 401 });
    }

    if (user.status === 'suspended') {
      return NextResponse.json({ error: 'Votre compte a été suspendu. Contactez l\'administration.', suspended: true }, { status: 403 });
    }

    const token = createSession(user.id, user.role);

    return NextResponse.json({
      user: {
        id: user.id,
        phone: user.phone,
        email: user.email,
        role: user.role,
        status: user.status,
        clientProfile: user.clientProfile,
        providerProfile: user.providerProfile,
        companyProfile: user.companyProfile,
      },
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Erreur lors de la connexion' }, { status: 500 });
  }
}
