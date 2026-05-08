import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, SessionData } from '@/lib/session';
import prisma from '@/lib/db';
import { getProviderOrderStatus, refillProviderOrder, mapProviderStatus } from '@/lib/provider';

type OrderStatusType = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'PARTIAL' | 'CANCELED' | 'REFUNDED' | 'REFILL_AVAILABLE' | 'FAILED';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getIronSession<SessionData>(cookies(), sessionOptions);
    if (!session.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const order = await prisma.order.findUnique({ where: { id: params.id }, include: { service: true } });
    if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (order.userId !== session.userId && session.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

    if (order.providerOrderId && !['COMPLETED', 'CANCELED', 'REFUNDED'].includes(order.status)) {
      const ps = await getProviderOrderStatus(order.providerOrderId);
      if (ps) {
        await prisma.order.update({ where: { id: order.id }, data: { status: mapProviderStatus(ps.status) as OrderStatusType, startCount: ps.start_count ? parseInt(ps.start_count) : undefined, remains: ps.remains ? parseInt(ps.remains) : undefined } });
      }
    }

    const updated = await prisma.order.findUnique({ where: { id: params.id }, include: { service: true } });
    return NextResponse.json({ order: updated });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getIronSession<SessionData>(cookies(), sessionOptions);
    if (!session.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { action } = await req.json();
    const order = await prisma.order.findUnique({ where: { id: params.id } });
    if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (order.userId !== session.userId && session.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

    if (action === 'refill' && order.providerOrderId) {
      const result = await refillProviderOrder(order.providerOrderId);
      if ('refill' in result) {
        await prisma.order.update({ where: { id: order.id }, data: { status: 'IN_PROGRESS' } });
        return NextResponse.json({ success: true });
      }
      return NextResponse.json({ error: 'refill' in result ? '' : (result as { error: string }).error }, { status: 502 });
    }
    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
