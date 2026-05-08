'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLang, useAuth } from '@/lib/context';

export default function ServicesPage() {
  const { t, locale } = useLang();
  const { user } = useAuth();
  const router = useRouter();
  const [services, setServices] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCat, setSelectedCat] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<{ service: any; link: string; qty: string } | null>(null);
  const [placing, setPlacing] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedCat) params.set('category', selectedCat);
    if (search) params.set('search', search);
    setLoading(true);
    fetch(`/api/services?${params}`).then(r => r.json()).then(d => {
      setServices(d.services || []);
      setCategories(d.categories || []);
    }).finally(() => setLoading(false));
  }, [selectedCat, search]);

  const placeOrder = async () => {
    if (!order) return;
    setPlacing(true);
    setMsg('');
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serviceId: order.service.id, link: order.link, quantity: parseInt(order.qty) }),
      });
      const d = await res.json();
      if (res.ok) { setMsg('✅ ' + (locale === 'ar' ? 'تم إرسال الطلب بنجاح' : 'Order placed successfully')); setOrder(null); router.push('/dashboard/orders'); }
      else setMsg('❌ ' + d.error);
    } finally { setPlacing(false); }
  };

  const cost = order ? ((order.service.finalPricePerK / 1000) * (parseInt(order.qty) || 0)) : 0;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">{t.services}</h1>

      <div className="flex flex-col sm:flex-row gap-3">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t.search}
          className="input-field flex-1" />
        <select value={selectedCat} onChange={e => setSelectedCat(e.target.value)} className="input-field sm:w-64">
          <option value="">{locale === 'ar' ? 'كل الفئات' : 'All Categories'}</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {loading ? <div className="text-center py-12 text-gray-500">{t.loading}</div> :
        services.length === 0 ? <div className="text-center py-12 text-gray-500">{t.noServices}</div> :
          <div className="grid gap-4">
            {services.map(s => (
              <div key={s.id} className="card hover:border-amber-500/30 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded">{locale === 'ar' && s.categoryAr ? s.categoryAr : s.category}</span>
                      {s.refill && <span className="text-xs text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded">Refill</span>}
                    </div>
                    <h3 className="text-white font-semibold">{locale === 'ar' && s.nameAr ? s.nameAr : s.name}</h3>
                    {s.description && <p className="text-gray-500 text-sm mt-1">{s.description}</p>}
                    <div className="flex gap-4 mt-2 text-xs text-gray-500">
                      <span>{t.min}: {s.min.toLocaleString()}</span>
                      <span>{t.max}: {s.max.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="text-end">
                    <p className="text-xl font-bold text-amber-500">${s.finalPricePerK.toFixed(3)}</p>
                    <p className="text-xs text-gray-500 mb-3">{t.perThousand}</p>
                    <button onClick={() => setOrder({ service: s, link: '', qty: String(s.min) })} className="btn-primary text-sm">
                      {t.orderNow}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
      }

      {order && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-md">
            <h3 className="text-lg font-bold text-white mb-4">{t.newOrder}</h3>
            <p className="text-gray-400 text-sm mb-4">{locale === 'ar' && order.service.nameAr ? order.service.nameAr : order.service.name}</p>
            {msg && <div className="text-sm mb-3 text-amber-400">{msg}</div>}
            <div className="space-y-3">
              <input value={order.link} onChange={e => setOrder({ ...order, link: e.target.value })}
                placeholder={t.link + ' (URL)'} className="input-field" />
              <input type="number" value={order.qty}
                onChange={e => setOrder({ ...order, qty: e.target.value })}
                min={order.service.min} max={order.service.max} className="input-field" />
              <div className="card-sm flex justify-between">
                <span className="text-gray-400 text-sm">{locale === 'ar' ? 'التكلفة' : 'Cost'}</span>
                <span className="text-amber-500 font-bold">${cost.toFixed(4)}</span>
              </div>
              <div className="card-sm flex justify-between">
                <span className="text-gray-400 text-sm">{t.balance}</span>
                <span className={`font-bold ${(user?.walletBalance || 0) >= cost ? 'text-green-400' : 'text-red-400'}`}>
                  ${user?.walletBalance.toFixed(2)}
                </span>
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={() => setOrder(null)} className="btn-secondary flex-1">{t.cancel}</button>
              <button onClick={placeOrder} disabled={placing || !order.link || cost > (user?.walletBalance || 0)}
                className="btn-primary flex-1">{placing ? t.loading : t.confirm}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
