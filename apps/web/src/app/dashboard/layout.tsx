'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: '◼' },
  { href: '/dashboard/projects', label: 'Proyek', icon: '🏗' },
  { href: '/dashboard/ahsp', label: 'AHSP Engine', icon: '📐' },
  { href: '/dashboard/rab-rap', label: 'RAB / RAP', icon: '📋' },
  { href: '/dashboard/tax', label: 'Tax Engine', icon: '🧾' },
  { href: '/dashboard/jobs', label: 'Jobs', icon: '✅' },
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
      <aside className="w-60 bg-brand-900 text-white flex flex-col">
        <div className="px-5 py-4 border-b border-brand-700">
          <div className="font-bold text-lg">AutoRAB X</div>
          <div className="text-blue-300 text-xs mt-0.5">Enterprise EPC v6.0</div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${
                  active ? 'bg-brand-600 text-white' : 'text-blue-200 hover:bg-brand-800'
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="px-5 py-4 border-t border-brand-700 text-xs text-blue-300">
          <div className="font-medium text-white">
            {user?.firstName} {user?.lastName}
          </div>
          <div>{user?.email}</div>
          <button
            onClick={logout}
            className="mt-2 text-red-300 hover:text-red-100 transition"
          >
            Keluar
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
