'use client';

import { useEffect, useState } from 'react';
import { useAuth, useLang } from '@/lib/context';

interface Stats { ordersCount: number; totalSpent: number; pendingOrders: number; completedOrders: number; }

export default function DashboardPage() {
  const { user } = useAuth();
  const { t } = useLang();
  const [stats, setStats] = useState<Stats>({ ordersCount: 0, totalSpent: 0, pendingOrders: 0, completedOrders: 0 });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/orders').then(r => r.json()).then(d => {
      if (d.orders) {
        setRecentOrders(d.orders.slice(0, 5));
        setStats({
          ordersCount: d.total || 0,
          totalSpent: d.orders.reduce((s: number, o: any) => s + o.pricePaid, 0),
          pendingOrders: d.orders.filter((o: any) => o.status === 'PENDING' || o.status === 'IN_PROGRESS').length,
          completedOrders: d.orders.filter((o: any) => o.status === 'COMPLETED').length,
        });
      }
    });
  }, []);

  const statusBadge = (s: string) => {
    const map: Record<string, string> = {
      PENDING: 'badge-pending', IN_PROGRESS: 'badge-progress', COMPLETED: 'badge-completed',
      PARTIAL: 'badge-partial', CANCELED: 'badge-canceled', FAILED: 'badge-failed', REFUNDED: 'badge-refunded',
    };
    const labels: Record<string, string> = {
      PENDING: t.pending, IN_PROGRESS: t.inProgress, COMPLETED: t.completed,
      PARTIAL: t.partial, CANCELED: t.canceled, FAILED: t.failed, REFUNDED: t.refunded,
    };
    return <span className={map[s] || 'badge bg-gray-500/20 text-gray-400'}>{labels[s] || s}</span>;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">{t.dashboard}</h1>
        <p className="text-gray-500 mt-1">مرحباً، {user?.username}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: t.balance, value: `$${user?.walletBalance.toFixed(2)}`, color: 'text-amber-500', icon: '💳' },
          { label: t.totalSpent, value: `$${user?.totalSpent.toFixed(2)}`, color: 'text-blue-400', icon: '💸' },
          { label: t.totalOrders, value: stats.ordersCount, color: 'text-purple-400', icon: '📦' },
          { label: t.completed, value: stats.completedOrders, color: 'text-green-400', icon: '✅' },
        ].map((s, i) => (
          <div key={i} className="card">
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">{s.icon}</span>
            </div>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-gray-500 text-sm mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="card">
        <h2 className="text-lg font-bold text-white mb-4">{t.orders}</h2>
        {recentOrders.length === 0 ? (
          <p className="text-gray-500 text-center py-8">{t.noOrders}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#1f1f1f]">
                  <th className="table-header">#</th>
                  <th className="table-header">{t.services}</th>
                  <th className="table-header">{t.quantity}</th>
                  <th className="table-header">{t.price}</th>
                  <th className="table-header">{t.status}</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((o, i) => (
                  <tr key={o.id} className="table-row">
                    <td className="table-cell text-gray-500">{i + 1}</td>
                    <td className="table-cell text-white font-medium">{o.service?.name}</td>
                    <td className="table-cell">{o.quantity.toLocaleString()}</td>
                    <td className="table-cell text-amber-500">${o.pricePaid.toFixed(4)}</td>
                    <td className="table-cell">{statusBadge(o.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
