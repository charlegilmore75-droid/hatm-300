'use client';

import { useEffect, useState } from 'react';
import { useLang } from '@/lib/context';

export default function AdminServicesPage() {
  const { t, locale } = useLang();
  const [services, setServices] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<any>(null);
  const [syncing, setSyncing] = useState(false);
  const [msg, setMsg] = useState('');

  const load = () => {
    setLoading(true);
    const p = new URLSearchParams({ admin: 'true' });
    if (search) p.set('search', search);
    fetch(`/api/services?${p}`).then(r => r.json()).then(d => setServices(d.services || [])).finally(() => setLoading(false));
  };

  useEffect(load, [search]);

  const sync = async () => {
    setSyncing(true); setSyncMsg('');
    const res = await fetch('/api/services/sync', { method: 'POST' });
    const d = await res.json();
    if (res.ok) setMsg(`✅ ${d.created} ${locale === 'ar' ? 'جديد' : 'new'}, ${d.updated} ${locale === 'ar' ? 'محدث' : 'updated'}`);
    else setMsg('❌ ' + d.error);
    setSyncing(false); load();
  };

  const update = async (id: string, data: Record<string, unknown>) => {
    await fetch(`/api/services/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    load(); setEditing(null);
  };

  let setSyncMsg = setMsg;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-white">{t.services}</h1>
        <button onClick={sync} disabled={syncing} className="btn-primary text-sm">{syncing ? t.loading : t.syncServices}</button>
      </div>

      {msg && <div className="card-sm text-sm text-amber-400">{msg}</div>}

      <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t.search} className="input-field max-w-sm" />

      {loading ? <div className="text-center py-12 text-gray-500">{t.loading}</div> :
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#0d0d0d]">
                <tr>
                  {['ID', t.services, t.category, t.price, t.markupPercent, t.status, t.actions].map(h => (
                    <th key={h} className="table-header">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {services.map(s => (
                  <tr key={s.id} className="table-row">
                    <td className="table-cell text-gray-500 text-xs">{s.providerId}</td>
                    <td className="table-cell text-white max-w-[200px] truncate font-medium">{s.name}</td>
                    <td className="table-cell text-gray-400">{s.category}</td>
                    <td className="table-cell text-amber-500">${s.finalPricePerK.toFixed(4)}</td>
                    <td className="table-cell text-gray-400">{s.markupPercent}%</td>
                    <td className="table-cell">
                      <div className="flex gap-1">
                        <span className={s.isActive ? 'badge badge-completed' : 'badge badge-failed'}>
                          {s.isActive ? t.active : t.inactive}
                        </span>
                        {s.isHidden && <span className="badge badge-canceled">{t.hidden}</span>}
                      </div>
                    </td>
                    <td className="table-cell">
                      <div className="flex gap-2">
                        <button onClick={() => setEditing(s)} className="btn-secondary text-xs px-2 py-1">{t.edit}</button>
                        <button onClick={() => update(s.id, { isActive: !s.isActive })}
                          className={`text-xs px-2 py-1 rounded-lg ${s.isActive ? 'btn-danger' : 'btn-success'}`}>
                          {s.isActive ? t.inactive : t.active}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      }

      {editing && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-lg overflow-y-auto max-h-[90vh]">
            <h3 className="text-lg font-bold text-white mb-4">{t.edit}</h3>
            <p className="text-gray-400 text-sm mb-4">{editing.name}</p>
            <div className="space-y-3">
              <input defaultValue={editing.nameAr || ''} id="nameAr" placeholder={locale === 'ar' ? 'اسم الخدمة بالعربي' : 'Arabic name'} className="input-field" />
              <input defaultValue={editing.categoryAr || ''} id="catAr" placeholder={locale === 'ar' ? 'الفئة بالعربي' : 'Arabic category'} className="input-field" />
              <input type="number" defaultValue={editing.markupPercent} id="markup" placeholder={t.markupPercent} className="input-field" />
              <div className="flex gap-3">
                <button onClick={() => setEditing(null)} className="btn-secondary flex-1">{t.cancel}</button>
                <button onClick={() => update(editing.id, {
                  nameAr: (document.getElementById('nameAr') as HTMLInputElement).value,
                  categoryAr: (document.getElementById('catAr') as HTMLInputElement).value,
                  markupPercent: parseFloat((document.getElementById('markup') as HTMLInputElement).value),
                  basePricePerK: editing.basePricePerK,
                })} className="btn-primary flex-1">{t.save}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
