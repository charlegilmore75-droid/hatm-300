import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, SessionData } from '@/lib/session';
import prisma from '@/lib/db';
import { placeProviderOrder } from '@/lib/provider';

export async function GET(req: NextRequest) {
  try {
    const session = await getIronSession<SessionData>(cookies(), sessionOptions);
    if (!session.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const isAdmin = session.role === 'ADMIN' && searchParams.get('admin') === 'true';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = 20;

    const where = isAdmin ? {} : { userId: session.userId };
    const [orders, total] = await Promise.all([
      prisma.order.findMany({ where, include: { service: true, user: { select: { username: true, email: true } } }, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit }),
      prisma.order.count({ where }),
    ]);
    return NextResponse.json({ orders, total, page, pages: Math.ceil(total / limit) });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getIronSession<SessionData>(cookies(), sessionOptions);
    if (!session.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { serviceId, link, quantity } = await req.json();
    if (!serviceId || !link || !quantity) return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });

    const service = await prisma.service.findUnique({ where: { id: serviceId } });
    if (!service || !service.isActive) return NextResponse.json({ error: 'Service not available' }, { status: 404 });
    if (quantity < service.min || quantity > service.max) return NextResponse.json({ error: `Quantity must be between ${service.min} and ${service.max}` }, { status: 400 });

    const totalCost = parseFloat(((service.finalPricePerK / 1000) * quantity).toFixed(4));
    const purchaseCost = parseFloat(((service.basePricePerK / 1000) * quantity).toFixed(4));
    const profit = parseFloat((totalCost - purchaseCost).toFixed(4));

    const user = await prisma.user.findUnique({ where: { id: session.userId } });
    if (!user || user.walletBalance < totalCost) return NextResponse.json({ error: 'Insufficient wallet balance' }, { status: 400 });

    await prisma.user.update({ where: { id: session.userId }, data: { walletBalance: { decrement: totalCost }, totalSpent: { increment: totalCost } } });

    const order = await prisma.order.create({ data: { userId: session.userId, serviceId, link, quantity, pricePaid: totalCost, purchaseCost, profit, status: 'PENDING' } });

    const providerRes = await placeProviderOrder(service.providerId, link, quantity);
    if ('order' in providerRes) {
      await prisma.order.update({ where: { id: order.id }, data: { providerOrderId: providerRes.order, status: 'IN_PROGRESS' } });
    } else {
      await prisma.user.update({ where: { id: session.userId }, data: { walletBalance: { increment: totalCost }, totalSpent: { decrement: totalCost } } });
      await prisma.order.update({ where: { id: order.id }, data: { status: 'FAILED' } });
      return NextResponse.json({ error: 'Provider rejected order. Refund issued.' }, { status: 502 });
    }

    return NextResponse.json({ order, success: true });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
