import { NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, SessionData } from '@/lib/session';
import prisma from '@/lib/db';

export async function GET() {
  try {
    const session = await getIronSession<SessionData>(cookies(), sessionOptions);
    if (!session.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const methods = await prisma.paymentMethod.findMany({ where: session.role === 'ADMIN' ? {} : { isActive: true }, orderBy: { name: 'asc' } });
    return NextResponse.json({ methods });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
