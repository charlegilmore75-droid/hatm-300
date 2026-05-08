import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, SessionData } from '@/lib/session';
import prisma from '@/lib/db';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getIronSession<SessionData>(cookies(), sessionOptions);
    if (!session.userId || session.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const service = await prisma.service.findUnique({ where: { id: params.id } });
    if (!service) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const finalPricePerK = body.markupPercent !== undefined
      ? parseFloat(((body.basePricePerK ?? service.basePricePerK) * (1 + (body.markupPercent ?? service.markupPercent) / 100)).toFixed(4))
      : service.finalPricePerK;

    const updated = await prisma.service.update({
      where: { id: params.id },
      data: {
        ...(body.nameAr !== undefined && { nameAr: body.nameAr }),
        ...(body.categoryAr !== undefined && { categoryAr: body.categoryAr }),
        ...(body.markupPercent !== undefined && { markupPercent: body.markupPercent, finalPricePerK }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
        ...(body.isHidden !== undefined && { isHidden: body.isHidden }),
      },
    });
    return NextResponse.json({ service: updated });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getIronSession<SessionData>(cookies(), sessionOptions);
    if (!session.userId || session.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await prisma.service.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
