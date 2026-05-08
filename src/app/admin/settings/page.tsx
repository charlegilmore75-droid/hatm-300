'use client';

import { useEffect, useState } from 'react';
import { useLang } from '@/lib/context';

export default function AdminSettingsPage() {
  const { t, locale } = useLang();
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [apiConfig, setApiConfig] = useState({ apiKey: '', baseUrl: '' });
  const [methods, setMethods] = useState<any[]>([]);
  const [newMethod, setNewMethod] = useState({ name: '', nameAr: '', accountInfo: '', currency: 'USD', minAmount: 5, maxAmount: 10000, isActive: true, instructions: '', instructionsAr: '' });
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(true);

  const load = () => {
    fetch('/api/admin/settings').then(r => r.json()).then(d => {
      setSettings(d.settings || {});
      setApiConfig({ apiKey: d.apiConfig?.apiKey || '', baseUrl: d.apiConfig?.baseUrl || '' });
      setMethods(d.paymentMethods || []);
    }).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const save = async (type: string, data: unknown) => {
    const res = await fetch('/api/admin/settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type, data }) });
    const d = await res.json();
    if (res.ok) { setMsg('✅ ' + t.success); load(); }
    else setMsg('❌ ' + d.error);
  };

  const toggleMethod = async (id: string, isActive: boolean) => {
    await fetch('/api/admin/settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'payment_method', data: { id, isActive } }) });
    load();
  };

  if (loading) return <div className="text-center py-12 text-gray-500">{t.loading}</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">{t.settings}</h1>

      {msg && <div className="card-sm text-sm text-amber-400">{msg}</div>}

      {/* Global Settings */}
      <div className="card">
        <h2 className="text-lg font-bold text-white mb-4">{locale === 'ar' ? 'الإعدادات العامة' : 'General Settings'}</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-gray-400 text-sm block mb-1">{t.globalMarkup} (%)</label>
            <input type="number" defaultValue={settings.global_markup || '20'} id="markup" className="input-field" />
          </div>
          <div>
            <label className="text-gray-400 text-sm block mb-1">{t.currency}</label>
            <input defaultValue={settings.currency || 'USD'} id="currency" className="input-field" />
          </div>
        </div>
        <button className="btn-primary mt-4" onClick={() => save('settings', {
          global_markup: (document.getElementById('markup') as HTMLInputElement).value,
          currency: (document.getElementById('currency') as HTMLInputElement).value,
        })}>{t.save}</button>
      </div>

      {/* API Config */}
      <div className="card">
        <h2 className="text-lg font-bold text-white mb-4">{locale === 'ar' ? 'إعدادات مزود الخدمة' : 'Provider API Settings'}</h2>
        <div className="space-y-3">
          <div>
            <label className="text-gray-400 text-sm block mb-1">{t.apiKey}</label>
            <input value={apiConfig.apiKey} onChange={e => setApiConfig({ ...apiConfig, apiKey: e.target.value })} className="input-field font-mono" />
          </div>
          <div>
            <label className="text-gray-400 text-sm block mb-1">{t.apiUrl}</label>
            <input value={apiConfig.baseUrl} onChange={e => setApiConfig({ ...apiConfig, baseUrl: e.target.value })} className="input-field" />
          </div>
        </div>
        <button className="btn-primary mt-4" onClick={() => save('api', apiConfig)}>{t.save}</button>
      </div>

      {/* Payment Methods */}
      <div className="card">
        <h2 className="text-lg font-bold text-white mb-4">{t.paymentMethods}</h2>
        <div className="space-y-3 mb-6">
          {methods.map(m => (
            <div key={m.id} className="card-sm flex items-center justify-between">
              <div>
                <p className="text-white font-medium">{locale === 'ar' ? m.nameAr : m.name}</p>
                <p className="text-gray-500 text-sm font-mono">{m.accountInfo}</p>
                <p className="text-gray-600 text-xs">{m.currency} | ${m.minAmount} - ${m.maxAmount}</p>
              </div>
              <button onClick={() => toggleMethod(m.id, !m.isActive)}
                className={m.isActive ? 'btn-danger text-xs px-2 py-1' : 'btn-success text-xs px-2 py-1'}>
                {m.isActive ? t.inactive : t.active}
              </button>
            </div>
          ))}
        </div>

        <h3 className="text-white font-semibold mb-3">{t.addPaymentMethod}</h3>
        <div className="grid sm:grid-cols-2 gap-3">
          <input value={newMethod.name} onChange={e => setNewMethod({ ...newMethod, name: e.target.value })} placeholder={locale === 'ar' ? 'الاسم بالإنجليزي' : 'Name (EN)'} className="input-field" />
          <input value={newMethod.nameAr} onChange={e => setNewMethod({ ...newMethod, nameAr: e.target.value })} placeholder="الاسم بالعربي" className="input-field" />
          <input value={newMethod.accountInfo} onChange={e => setNewMethod({ ...newMethod, accountInfo: e.target.value })} placeholder={t.accountInfo} className="input-field sm:col-span-2" />
          <input value={newMethod.instructions} onChange={e => setNewMethod({ ...newMethod, instructions: e.target.value })} placeholder={`${t.instructions} (EN)`} className="input-field" />
          <input value={newMethod.instructionsAr} onChange={e => setNewMethod({ ...newMethod, instructionsAr: e.target.value })} placeholder="التعليمات بالعربي" className="input-field" />
          <input type="number" value={newMethod.minAmount} onChange={e => setNewMethod({ ...newMethod, minAmount: parseFloat(e.target.value) })} placeholder={`${t.min} $`} className="input-field" />
          <input type="number" value={newMethod.maxAmount} onChange={e => setNewMethod({ ...newMethod, maxAmount: parseFloat(e.target.value) })} placeholder={`${t.max} $`} className="input-field" />
          <input value={newMethod.currency} onChange={e => setNewMethod({ ...newMethod, currency: e.target.value })} placeholder={t.currency} className="input-field" />
        </div>
        <button className="btn-primary mt-4" onClick={() => save('payment_method', newMethod)}>{t.addPaymentMethod}</button>
      </div>
    </div>
  );
}
