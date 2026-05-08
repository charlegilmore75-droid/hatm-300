import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/db';

export async function GET() {
  try {
    const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } });
    if (adminCount > 0) return NextResponse.json({ message: 'Already initialized' });

    const hash = await bcrypt.hash('admin123', 12);
    await prisma.user.create({ data: { email: 'admin@hatm.com', username: 'admin', password: hash, role: 'ADMIN' } });

    await prisma.siteSetting.createMany({
      data: [
        { key: 'global_markup', value: '20' },
        { key: 'site_name', value: 'HATM' },
        { key: 'currency', value: 'USD' },
      ],
      skipDuplicates: true,
    });

    await prisma.apiProviderConfig.create({
      data: { name: 'BoostProvider', apiKey: '426497afd24be9cf36cf7f744b4bbbc7', baseUrl: 'https://boostprovider.com/api/v2' },
    });

    await prisma.paymentMethod.createMany({
      data: [
        { name: 'USDT BEP20', nameAr: 'USDT شبكة BEP20', accountInfo: 'TRX_ADDRESS_HERE', currency: 'USDT', minAmount: 5, maxAmount: 10000, instructions: 'Send USDT via BEP20 network', instructionsAr: 'أرسل USDT عبر شبكة BEP20' },
        { name: 'USDT TRC20', nameAr: 'USDT شبكة TRC20', accountInfo: 'TRC20_ADDRESS_HERE', currency: 'USDT', minAmount: 5, maxAmount: 10000, instructions: 'Send USDT via TRC20 network', instructionsAr: 'أرسل USDT عبر شبكة TRC20' },
        { name: 'Syriatel Cash', nameAr: 'سيريتل كاش', accountInfo: '09XXXXXXXX', currency: 'SYP', conversionRate: 0.00038, minAmount: 1, maxAmount: 5000, instructions: 'Send via Syriatel Cash', instructionsAr: 'أرسل عبر سيريتل كاش' },
      ],
      skipDuplicates: true,
    });

    return NextResponse.json({ success: true, message: 'Admin created: admin@hatm.com / admin123' });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
