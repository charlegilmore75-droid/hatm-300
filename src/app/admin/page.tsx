'use client';

import { useEffect, useState } from 'react';
import { useLang } from '@/lib/context';

export default function AdminDashboard() {
  const { t, locale } = useLang();
  const [stats, setStats] = useState<any>(null);
  const [balance, setBalance] = useState('...');
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState('');

  useEffect(() => {
    fetch('/api/admin/stats').then(r => r.json()).then(setStats);
    fetch('/api/provider/balance').then(r => r.json()).then(d => setBalance(d.balance || '0'));
  }, []);

  const syncServices = async () => {
    setSyncing(true); setSyncMsg('');
    const res = await fetch('/api/services/sync', { method: 'POST' });
    const d = await res.json();
    if (res.ok) setSyncMsg(`✅ ${locale === 'ar' ? `تمت المزامنة: ${d.created} جديد، ${d.updated} محدث` : `Synced: ${d.created} new, ${d.updated} updated`}`);
    else setSyncMsg('❌ ' + d.error);
    setSyncing(false);
  };

  const cards = stats ? [
    { label: t.totalUsers, value: stats.totalUsers, icon: '👥', color: 'text-blue-400' },
    { label: t.totalOrders, value: stats.totalOrders, icon: '📦', color: 'text-purple-400' },
    { label: t.totalProfit, value: `$${(stats.totalProfit || 0).toFixed(2)}`, icon: '💰', color: 'text-green-400' },
    { label: t.pendingTopups, value: stats.pendingTopUps, icon: '⏳', color: 'text-yellow-400' },
    { label: locale === 'ar' ? 'إجمالي الأرصدة' : 'Total Wallets', value: `$${(stats.totalWalletBalance || 0).toFixed(2)}`, icon: '💳', color: 'text-amber-500' },
    { label: locale === 'ar' ? 'إجمالي الإنفاق' : 'Total Spent', value: `$${(stats.totalSpent || 0).toFixed(2)}`, icon: '💸', color: 'text-red-400' },
    { label: locale === 'ar' ? 'طلبات مكتملة' : 'Completed', value: stats.completedOrders, icon: '✅', color: 'text-green-400' },
    { label: locale === 'ar' ? 'طلبات فاشلة' : 'Failed', value: stats.failedOrders, icon: '❌', color: 'text-red-400' },
  ] : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-white">{t.dashboard}</h1>
        <div className="flex items-center gap-3">
          <div className="card-sm flex items-center gap-2 py-2">
            <span className="text-gray-400 text-sm">{t.providerBalance}:</span>
            <span className="text-amber-500 font-bold">${balance}</span>
          </div>
          <button onClick={syncServices} disabled={syncing} className="btn-primary text-sm">
            {syncing ? t.loading : t.syncServices}
          </button>
        </div>
      </div>

      {syncMsg && <div className="card-sm text-sm text-amber-400">{syncMsg}</div>}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c, i) => (
          <div key={i} className="card">
            <div className="flex items-center justify-between mb-3">
              <span className="text-2xl">{c.icon}</span>
            </div>
            <p className={`text-2xl font-bold ${c.color}`}>{c.value}</p>
            <p className="text-gray-500 text-sm mt-1">{c.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
