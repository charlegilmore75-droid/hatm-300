import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, SessionData } from '@/lib/session';
import prisma from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const session = await getIronSession<SessionData>(cookies(), sessionOptions);
    if (!session.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const adminView = searchParams.get('admin') === 'true' && session.role === 'ADMIN';

    const where: Record<string, unknown> = {};
    if (!adminView) { where.isActive = true; where.isHidden = false; }
    if (category) where.category = category;
    if (search) where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { nameAr: { contains: search, mode: 'insensitive' } },
      { category: { contains: search, mode: 'insensitive' } },
    ];

    const services = await prisma.service.findMany({ where, orderBy: [{ category: 'asc' }, { name: 'asc' }] });
    const categories = [...new Set(services.map(s => s.category))];
    return NextResponse.json({ services, categories });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
