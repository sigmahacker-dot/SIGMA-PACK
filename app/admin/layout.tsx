'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import React from 'react';
import { api } from '@/components/admin/ui';

const NAV = [
  { href: '/admin', label: 'Dashboard', icon: '▦' },
  { href: '/admin/orders', label: 'Orders', icon: '🧾' },
  { href: '/admin/buyers', label: 'Buyers', icon: '👥' },
  { href: '/admin/tools', label: 'Tools', icon: '🛠️' },
  { href: '/admin/plans', label: 'Plans', icon: '💳' },
  { href: '/admin/credentials', label: 'Credentials', icon: '🔑' },
  { href: '/admin/settings', label: 'Settings', icon: '⚙️' },
  { href: '/admin/audit', label: 'Audit Log', icon: '📜' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [loggingOut, setLoggingOut] = React.useState(false);

  const logout = async () => {
    setLoggingOut(true);
    try {
      await api('/api/auth/logout', { method: 'POST' });
    } catch {
      /* still redirect */
    }
    router.push('/admin/login');
    router.refresh();
  };

  const isActive = (href: string) =>
    href === '/admin' ? pathname === '/admin' : pathname.startsWith(href);

  // Login & setup pages get a bare shell (no sidebar).
  if (pathname === '/admin/login' || pathname === '/admin/setup') {
    return <div className="min-h-screen bg-navy text-slate-100">{children}</div>;
  }

  return (
    <div className="min-h-screen bg-navy text-slate-100">
      {/* Top bar */}
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between gap-3 border-b border-white/10 bg-navy-950/90 px-4 backdrop-blur">
        <div className="flex items-center gap-3">
          <button
            className="rounded-lg px-2.5 py-1.5 text-xl text-slate-300 hover:bg-white/10 lg:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {open ? '✕' : '☰'}
          </button>
          <Link href="/admin" className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand to-brand-light text-lg font-black text-white">
              Σ
            </span>
            <span className="font-bold text-white">
              Sigma Pack <span className="text-xs font-medium text-brand-light">Admin</span>
            </span>
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/"
            target="_blank"
            className="rounded-xl border border-white/15 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-white/10"
          >
            View Site
          </Link>
          <button
            onClick={logout}
            disabled={loggingOut}
            className="rounded-xl bg-red-500/15 px-4 py-2 text-sm font-semibold text-red-300 hover:bg-red-500/25 disabled:opacity-50"
          >
            {loggingOut ? '…' : 'Logout'}
          </button>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`fixed inset-y-16 z-30 w-60 shrink-0 border-r border-white/10 bg-navy-950/95 backdrop-blur transition-transform lg:static lg:translate-x-0 lg:self-start lg:sticky lg:top-16 lg:h-[calc(100vh-4rem)] ${
            open ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <nav className="space-y-1 p-4">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
                  isActive(item.href)
                    ? 'bg-brand/15 text-brand-light'
                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                <span className="w-6 text-center">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>

        {/* Backdrop for mobile */}
        {open && (
          <div
            className="fixed inset-0 z-20 bg-black/60 lg:hidden"
            onClick={() => setOpen(false)}
          />
        )}

        {/* Content */}
        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
