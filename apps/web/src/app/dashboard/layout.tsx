'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';

const navGroups = [
  {
    label: 'Utama',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: '◼', exact: true },
      { href: '/dashboard/analytics', label: 'Analytics & EVM', icon: '📊' },
      { href: '/dashboard/projects', label: 'Proyek', icon: '🏗' },
    ],
  },
  {
    label: 'Engineering',
    items: [
      { href: '/dashboard/ahsp', label: 'AHSP Engine', icon: '📐' },
      { href: '/dashboard/rab-rap', label: 'RAB / RAP', icon: '📋' },
      { href: '/dashboard/tax', label: 'Tax Engine', icon: '🧾' },
      { href: '/dashboard/progress-claims', label: 'Progress Claim', icon: '💰' },
    ],
  },
  {
    label: 'Lapangan',
    items: [
      { href: '/dashboard/jobs', label: 'Jobs & Tasks', icon: '✅' },
      { href: '/dashboard/daily-logs', label: 'Daily Log', icon: '📅' },
      { href: '/dashboard/ncr', label: 'NCR', icon: '⚠️' },
      { href: '/dashboard/rfi', label: 'RFI', icon: '❓' },
    ],
  },
  {
    label: 'Dokumen',
    items: [
      { href: '/dashboard/documents', label: 'Dokumen', icon: '📁' },
    ],
  },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, init, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    init();
  }, []);

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/login');
    }
  }, [isLoading, user]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Memuat...
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-60 bg-brand-900 text-white flex flex-col shrink-0">
        <div className="px-5 py-4 border-b border-brand-700">
          <div className="font-bold text-lg tracking-tight">AutoRAB X</div>
          <div className="text-blue-300 text-xs mt-0.5">Enterprise EPC v6.0</div>
        </div>

        <nav className="flex-1 px-3 py-3 space-y-4 overflow-y-auto">
          {navGroups.map((group) => (
            <div key={group.label}>
              <div className="px-3 mb-1 text-xs font-semibold text-blue-400 uppercase tracking-wider">
                {group.label}
              </div>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition ${
                        active ? 'bg-brand-600 text-white font-medium' : 'text-blue-200 hover:bg-brand-800'
                      }`}
                    >
                      <span className="text-base leading-none">{item.icon}</span>
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="px-5 py-4 border-t border-brand-700 text-xs text-blue-300">
          <div className="font-medium text-white truncate">
            {user?.firstName} {user?.lastName}
          </div>
          <div className="truncate">{user?.email}</div>
          <button
            onClick={logout}
            className="mt-2 text-red-300 hover:text-red-100 transition"
          >
            Keluar
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto min-w-0">{children}</main>
    </div>
  );
}
