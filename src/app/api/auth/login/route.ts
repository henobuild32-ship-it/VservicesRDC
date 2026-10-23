import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyPassword, hashPassword, getAdminPassword } from '@/lib/auth';
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
      const configured = getAdminPassword();
      if (!configured) {
        return NextResponse.json(
          { error: 'Configuration administrateur manquante (variable ADMIN_PASSWORD).' },
          { status: 500 }
        );
      }

      let admin = await db.user.findFirst({ where: { role: 'ADMIN' } });

      if (!admin) {
        // Premier demarrage : seul le mot de passe defini en env cree le compte
        if (adminPassword !== configured) {
          return NextResponse.json({ error: 'Mot de passe administrateur incorrect' }, { status: 401 });
        }
        admin = await db.user.create({
          data: {
            phone: '+243000000000',
            password: await hashPassword(configured),
            role: 'ADMIN',
            status: 'approved',
            adminMustChangePassword: true,
          },
        });
      } else {
        // Compte existant : verification contre le hash stocke (mdp personnel ou partage)
        const valid = await verifyPassword(adminPassword, admin.password);
        if (!valid) {
          return NextResponse.json({ error: 'Mot de passe administrateur incorrect' }, { status: 401 });
        }
      }

      // Tant que le mdp utilise est celui partage (env), changement impose
      const mustChange =
        admin.adminMustChangePassword || (await verifyPassword(configured, admin.password));
      if (mustChange && !admin.adminMustChangePassword) {
        admin = await db.user.update({
          where: { id: admin.id },
          data: { adminMustChangePassword: true },
        });
      }

      await db.userActivity.create({
        data: {
          userId: admin.id,
          action: 'login',
          details: JSON.stringify({ ip, time: new Date().toISOString(), method: 'admin' }),
        },
      });

      const token = createSession(admin.id, 'ADMIN');
      return NextResponse.json({
        user: {
          id: admin.id,
          phone: admin.phone,
          role: 'ADMIN',
          status: admin.status,
          adminMustChangePassword: mustChange,
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

    // Log activity
    await db.userActivity.create({
      data: { userId: user.id, action: 'login', details: JSON.stringify({ ip, time: new Date().toISOString() }) },
    });

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
