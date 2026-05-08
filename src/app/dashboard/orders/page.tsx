'use client';

import { useEffect, useState } from 'react';
import { useLang } from '@/lib/context';

export default function OrdersPage() {
  const { t, locale } = useLang();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const load = () => {
    setLoading(true);
    fetch(`/api/orders?page=${page}`).then(r => r.json()).then(d => {
      setOrders(d.orders || []);
      setTotal(d.total || 0);
    }).finally(() => setLoading(false));
  };

  useEffect(load, [page]);

  const statusBadge = (s: string) => {
    const map: Record<string, [string, string]> = {
      PENDING: ['badge-pending', t.pending], IN_PROGRESS: ['badge-progress', t.inProgress],
      COMPLETED: ['badge-completed', t.completed], PARTIAL: ['badge-partial', t.partial],
      CANCELED: ['badge-canceled', t.canceled], FAILED: ['badge-failed', t.failed],
      REFUNDED: ['badge-refunded', t.refunded], REFILL_AVAILABLE: ['badge-progress', 'Refill'],
    };
    const [cls, label] = map[s] || ['badge bg-gray-500/20 text-gray-400', s];
    return <span className={cls}>{label}</span>;
  };

  const refill = async (id: string) => {
    await fetch(`/api/orders/${id}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'refill' }) });
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">{t.orders}</h1>
        <span className="text-gray-500 text-sm">{locale === 'ar' ? `${total} طلب` : `${total} orders`}</span>
      </div>

      {loading ? <div className="text-center py-12 text-gray-500">{t.loading}</div> :
        orders.length === 0 ? <div className="text-center py-12 text-gray-500">{t.noOrders}</div> :
          <div className="card overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#0d0d0d]">
                  <tr>
                    {[t.services, t.link, t.quantity, t.price, t.status, t.date, t.actions].map(h => (
                      <th key={h} className="table-header">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {orders.map(o => (
                    <tr key={o.id} className="table-row">
                      <td className="table-cell text-white font-medium max-w-[200px] truncate">{o.service?.name}</td>
                      <td className="table-cell max-w-[150px] truncate">
                        <a href={o.link} target="_blank" rel="noreferrer" className="text-amber-500 hover:underline">{o.link}</a>
                      </td>
                      <td className="table-cell">{o.quantity.toLocaleString()}</td>
                      <td className="table-cell text-amber-500">${o.pricePaid.toFixed(4)}</td>
                      <td className="table-cell">{statusBadge(o.status)}</td>
                      <td className="table-cell text-gray-500">{new Date(o.createdAt).toLocaleDateString()}</td>
                      <td className="table-cell">
                        {(o.status === 'COMPLETED' || o.status === 'REFILL_AVAILABLE') && o.service?.refill && (
                          <button onClick={() => refill(o.id)} className="btn-secondary text-xs px-2 py-1">{t.refill}</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
      }

      {total > 20 && (
        <div className="flex justify-center gap-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary px-4">←</button>
          <span className="text-gray-400 px-4 py-2">{page}</span>
          <button onClick={() => setPage(p => p + 1)} disabled={page * 20 >= total} className="btn-secondary px-4">→</button>
        </div>
      )}
    </div>
  );
}
