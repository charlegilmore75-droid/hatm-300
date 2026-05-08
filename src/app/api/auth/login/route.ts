import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/db';
import { sessionOptions, SessionData } from '@/lib/session';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) return NextResponse.json({ error: 'Email and password required' }, { status: 400 });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    if (user.isBlocked) return NextResponse.json({ error: 'Account is blocked' }, { status: 403 });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });

    const session = await getIronSession<SessionData>(cookies(), sessionOptions);
    session.userId = user.id;
    session.email = user.email;
    session.username = user.username;
    session.role = user.role;
    await session.save();

    return NextResponse.json({ user: { id: user.id, email: user.email, username: user.username, role: user.role, walletBalance: user.walletBalance } });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
