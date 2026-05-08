import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, SessionData } from '@/lib/session';
import prisma from '@/lib/db';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getIronSession<SessionData>(cookies(), sessionOptions);
    if (!session.userId || session.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { action, creditedAmount } = await req.json();
    const request = await prisma.topUpRequest.findUnique({ where: { id: params.id }, include: { user: true } });
    if (!request) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    if (action === 'approve') {
      const credit = parseFloat(creditedAmount) || request.amount;
      await prisma.$transaction([
        prisma.topUpRequest.update({ where: { id: params.id }, data: { status: 'APPROVED', creditedAmount: credit, reviewedAt: new Date(), reviewedBy: session.userId } }),
        prisma.user.update({ where: { id: request.userId }, data: { walletBalance: { increment: credit } } }),
      ]);
    } else if (action === 'reject') {
      await prisma.topUpRequest.update({ where: { id: params.id }, data: { status: 'REJECTED', reviewedAt: new Date(), reviewedBy: session.userId } });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
