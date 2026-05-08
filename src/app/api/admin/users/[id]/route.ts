import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, SessionData } from '@/lib/session';
import prisma from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getIronSession<SessionData>(cookies(), sessionOptions);
    if (!session.userId || session.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const data: Record<string, unknown> = {};
    if (body.isBlocked !== undefined) data.isBlocked = body.isBlocked;
    if (body.walletBalance !== undefined) data.walletBalance = parseFloat(body.walletBalance);
    if (body.password) data.password = await bcrypt.hash(body.password, 12);

    const user = await prisma.user.update({ where: { id: params.id }, data });
    return NextResponse.json({ user, success: true });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getIronSession<SessionData>(cookies(), sessionOptions);
    if (!session.userId || session.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await prisma.user.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
