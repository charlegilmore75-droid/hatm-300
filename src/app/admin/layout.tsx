'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth, useLang } from '@/lib/context';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const { t, locale, setLocale, dir } = useLang();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && (!user || user.role !== 'ADMIN')) router.push('/login');
  }, [user, loading, router]);

  if (loading || !user) return (
    <div className="min-h-screen bg-dark flex items-center justify-center">
      <div className="w-12 h-12 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const navItems = [
    { href: '/admin', label: t.dashboard, icon: '📊' },
    { href: '/admin/users', label: t.users, icon: '👥' },
    { href: '/admin/services', label: t.services, icon: '🛍️' },
    { href: '/admin/orders', label: t.orders, icon: '📦' },
    { href: '/admin/topups', label: t.topups, icon: '💳' },
    { href: '/admin/analytics', label: t.analytics, icon: '📈' },
    { href: '/admin/settings', label: t.settings, icon: '⚙️' },
  ];

  const isActive = (href: string) => href === '/admin' ? pathname === href : pathname.startsWith(href);

  return (
    <div className="min-h-screen bg-dark" dir={dir}>
      <aside className="fixed top-0 start-0 h-full w-64 bg-[#0d0d0d] border-e border-[#1f1f1f] z-40 flex flex-col">
        <div className="p-6 border-b border-[#1f1f1f]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center">
              <span className="text-black font-black text-lg">H</span>
            </div>
            <div>
              <span className="text-amber-500 font-black text-xl tracking-wider">HATM</span>
              <p className="text-xs text-gray-600">{locale === 'ar' ? 'لوحة الإدارة' : 'Admin Panel'}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map(item => (
            <Link key={item.href} href={item.href}
              className={isActive(item.href) ? 'nav-link-active' : 'nav-link'}>
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-[#1f1f1f] space-y-2">
          <Link href="/dashboard" className="btn-secondary w-full text-sm text-center block">
            {locale === 'ar' ? '← لوحة المستخدم' : '← User Panel'}
          </Link>
          <button onClick={() => setLocale(locale === 'ar' ? 'en' : 'ar')} className="btn-secondary w-full text-sm">
            {locale === 'ar' ? '🌐 English' : '🌐 عربي'}
          </button>
          <button onClick={logout} className="btn-danger w-full text-sm">{t.logout}</button>
        </div>
      </aside>

      <main className="ms-64 min-h-screen">
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
