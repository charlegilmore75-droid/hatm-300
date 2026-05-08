import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, SessionData } from '@/lib/session';
import prisma from '@/lib/db';

export async function GET() {
  try {
    const session = await getIronSession<SessionData>(cookies(), sessionOptions);
    if (!session.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const requests = await prisma.topUpRequest.findMany({ where: { userId: session.userId }, include: { paymentMethod: true }, orderBy: { createdAt: 'desc' } });
    return NextResponse.json({ requests });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getIronSession<SessionData>(cookies(), sessionOptions);
    if (!session.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { paymentMethodId, amount, transactionRef, note } = await req.json();
    if (!paymentMethodId || !amount || !transactionRef) return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });

    const method = await prisma.paymentMethod.findUnique({ where: { id: paymentMethodId } });
    if (!method || !method.isActive) return NextResponse.json({ error: 'Payment method not available' }, { status: 404 });
    if (amount < method.minAmount || amount > method.maxAmount) return NextResponse.json({ error: `Amount must be between ${method.minAmount} and ${method.maxAmount}` }, { status: 400 });

    const request = await prisma.topUpRequest.create({ data: { userId: session.userId, paymentMethodId, amount: parseFloat(amount), transactionRef, note, status: 'PENDING' } });
    return NextResponse.json({ request, success: true });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
