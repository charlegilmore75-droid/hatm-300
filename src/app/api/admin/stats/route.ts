import { NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, SessionData } from '@/lib/session';
import prisma from '@/lib/db';

export async function GET() {
  try {
    const session = await getIronSession<SessionData>(cookies(), sessionOptions);
    if (!session.userId || session.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const [totalUsers, walletAgg, spentAgg, totalOrders, completedOrders, failedOrders, pendingOrders, profitAgg, pendingTopUps] = await Promise.all([
      prisma.user.count({ where: { role: 'USER' } }),
      prisma.user.aggregate({ _sum: { walletBalance: true } }),
      prisma.user.aggregate({ _sum: { totalSpent: true } }),
      prisma.order.count(),
      prisma.order.count({ where: { status: 'COMPLETED' } }),
      prisma.order.count({ where: { status: { in: ['FAILED', 'CANCELED'] } } }),
      prisma.order.count({ where: { status: { in: ['PENDING', 'IN_PROGRESS'] } } }),
      prisma.order.aggregate({ _sum: { profit: true } }),
      prisma.topUpRequest.count({ where: { status: 'PENDING' } }),
    ]);

    return NextResponse.json({ totalUsers, totalWalletBalance: walletAgg._sum.walletBalance || 0, totalSpent: spentAgg._sum.totalSpent || 0, totalOrders, completedOrders, failedOrders, pendingOrders, totalProfit: profitAgg._sum.profit || 0, pendingTopUps });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
