import { NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, SessionData } from '@/lib/session';
import prisma from '@/lib/db';
import { fetchProviderServices } from '@/lib/provider';

export async function POST() {
  try {
    const session = await getIronSession<SessionData>(cookies(), sessionOptions);
    if (!session.userId || session.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const markupSetting = await prisma.siteSetting.findUnique({ where: { key: 'global_markup' } });
    const markup = parseFloat(markupSetting?.value || '20');
    const providerServices = await fetchProviderServices();
    if (!providerServices.length) return NextResponse.json({ error: 'No services from provider' }, { status: 502 });

    let created = 0, updated = 0;
    for (const ps of providerServices) {
      const base = parseFloat(ps.rate);
      const final = parseFloat((base * (1 + markup / 100)).toFixed(4));
      const existing = await prisma.service.findUnique({ where: { providerId: ps.service } });
      if (existing) {
        await prisma.service.update({ where: { providerId: ps.service }, data: { name: ps.name, category: ps.category, min: parseInt(ps.min), max: parseInt(ps.max), basePricePerK: base, finalPricePerK: final, refill: ps.refill, cancel: ps.cancel, type: ps.type } });
        updated++;
      } else {
        await prisma.service.create({ data: { providerId: ps.service, name: ps.name, category: ps.category, min: parseInt(ps.min), max: parseInt(ps.max), basePricePerK: base, markupPercent: markup, finalPricePerK: final, refill: ps.refill, cancel: ps.cancel, type: ps.type } });
        created++;
      }
    }
    return NextResponse.json({ success: true, created, updated });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
