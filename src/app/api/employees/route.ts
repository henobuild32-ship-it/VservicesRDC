import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';

// GET: List employees for current company
export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    const session = getSession(token);
    if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    if (session.role !== 'ENTREPRISE') return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });

    const company = await db.companyProfile.findUnique({ where: { userId: session.userId } });
    if (!company) return NextResponse.json({ error: 'Profil entreprise non trouvé' }, { status: 404 });

    const employees = await db.employee.findMany({ where: { companyId: company.id }, orderBy: { createdAt: 'asc' } });
    return NextResponse.json({ employees });
  } catch (error) {
    console.error('Employees list error:', error);
    return NextResponse.json({ error: 'Erreur' }, { status: 500 });
  }
}

// POST: Add an employee
export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    const session = getSession(token);
    if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    if (session.role !== 'ENTREPRISE') return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });

    const body = await req.json();
    if (!body.fullName || !body.function) {
      return NextResponse.json({ error: 'Nom et fonction requis' }, { status: 400 });
    }

    const company = await db.companyProfile.findUnique({ where: { userId: session.userId } });
    if (!company) return NextResponse.json({ error: 'Profil entreprise non trouvé' }, { status: 404 });

    const employee = await db.employee.create({
      data: {
        companyId: company.id,
        fullName: body.fullName,
        function: body.function,
        phone: body.phone || null,
        email: body.email || null,
        isManager: body.isManager || false,
      },
    });

    // Update employee count
    const count = await db.employee.count({ where: { companyId: company.id } });
    await db.companyProfile.update({ where: { id: company.id }, data: { employeeCount: count } });

    // Update User profile too
    await db.user.update({ where: { id: session.userId }, data: { role: 'ENTREPRISE' } });

    return NextResponse.json({ employee });
  } catch (error) {
    console.error('Employee create error:', error);
    return NextResponse.json({ error: 'Erreur' }, { status: 500 });
  }
}

// DELETE: Remove an employee
export async function DELETE(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    const session = getSession(token);
    if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    if (session.role !== 'ENTREPRISE') return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const employeeId = searchParams.get('id');
    if (!employeeId) return NextResponse.json({ error: 'ID employé requis' }, { status: 400 });

    const company = await db.companyProfile.findUnique({ where: { userId: session.userId } });
    if (!company) return NextResponse.json({ error: 'Profil entreprise non trouvé' }, { status: 404 });

    const emp = await db.employee.findFirst({ where: { id: employeeId, companyId: company.id } });
    if (!emp) return NextResponse.json({ error: 'Employé non trouvé' }, { status: 404 });

    await db.employee.delete({ where: { id: employeeId } });

    const count = await db.employee.count({ where: { companyId: company.id } });
    await db.companyProfile.update({ where: { id: company.id }, data: { employeeCount: count } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Employee delete error:', error);
    return NextResponse.json({ error: 'Erreur' }, { status: 500 });
  }
}
