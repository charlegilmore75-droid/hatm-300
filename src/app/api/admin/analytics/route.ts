import { NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, SessionData } from '@/lib/session';
import prisma from '@/lib/db';

export async function GET() {
  try {
    const session = await getIronSession<SessionData>(cookies(), sessionOptions);
    if (!session.userId || session.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [recentOrders, topServices, topUsers, dailyRevenue] = await Promise.all([
      prisma.order.findMany({ where: { createdAt: { gte: thirtyDaysAgo } }, include: { service: { select: { name: true } }, user: { select: { username: true } } }, orderBy: { createdAt: 'desc' }, take: 10 }),
      prisma.order.groupBy({ by: ['serviceId'], _count: { id: true }, _sum: { pricePaid: true, profit: true }, orderBy: { _sum: { pricePaid: 'desc' } }, take: 10 }),
      prisma.user.findMany({ where: { role: 'USER' }, orderBy: { totalSpent: 'desc' }, take: 10, select: { id: true, username: true, email: true, totalSpent: true, walletBalance: true } }),
      prisma.order.findMany({ where: { createdAt: { gte: thirtyDaysAgo } }, select: { pricePaid: true, profit: true, createdAt: true }, orderBy: { createdAt: 'asc' } }),
    ]);

    const dailyMap: Record<string, { revenue: number; profit: number }> = {};
    for (const o of dailyRevenue) {
      const day = o.createdAt.toISOString().split('T')[0];
      if (!dailyMap[day]) dailyMap[day] = { revenue: 0, profit: 0 };
      dailyMap[day].revenue += o.pricePaid;
      dailyMap[day].profit += o.profit;
    }
    const dailyData = Object.entries(dailyMap).map(([date, v]) => ({ date, ...v }));

    const serviceIds = topServices.map(s => s.serviceId);
    const services = await prisma.service.findMany({ where: { id: { in: serviceIds } }, select: { id: true, name: true } });
    const serviceMap = Object.fromEntries(services.map(s => [s.id, s.name]));

    const enrichedTopServices = topServices.map(s => ({ serviceId: s.serviceId, serviceName: serviceMap[s.serviceId] || 'Unknown', orderCount: s._count.id, totalRevenue: s._sum.pricePaid || 0, totalProfit: s._sum.profit || 0 }));

    return NextResponse.json({ recentOrders, topServices: enrichedTopServices, topUsers, dailyData });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
