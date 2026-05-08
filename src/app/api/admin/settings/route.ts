import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, SessionData } from '@/lib/session';
import prisma from '@/lib/db';

export async function GET() {
  try {
    const session = await getIronSession<SessionData>(cookies(), sessionOptions);
    if (!session.userId || session.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const [settings, apiConfig, paymentMethods] = await Promise.all([
      prisma.siteSetting.findMany(),
      prisma.apiProviderConfig.findFirst({ where: { isActive: true } }),
      prisma.paymentMethod.findMany({ orderBy: { name: 'asc' } }),
    ]);

    const settingsMap = settings.reduce((acc, s) => ({ ...acc, [s.key]: s.value }), {} as Record<string, string>);
    return NextResponse.json({ settings: settingsMap, apiConfig, paymentMethods });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getIronSession<SessionData>(cookies(), sessionOptions);
    if (!session.userId || session.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { type, data } = await req.json();

    if (type === 'settings') {
      for (const [key, value] of Object.entries(data as Record<string, string>)) {
        await prisma.siteSetting.upsert({ where: { key }, update: { value }, create: { key, value } });
      }
    } else if (type === 'api') {
      const existing = await prisma.apiProviderConfig.findFirst();
      if (existing) await prisma.apiProviderConfig.update({ where: { id: existing.id }, data: { apiKey: data.apiKey, baseUrl: data.baseUrl } });
      else await prisma.apiProviderConfig.create({ data: { name: 'Provider', apiKey: data.apiKey, baseUrl: data.baseUrl } });
    } else if (type === 'payment_method') {
      if (data.id) await prisma.paymentMethod.update({ where: { id: data.id }, data: { isActive: data.isActive } });
      else await prisma.paymentMethod.create({ data });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
