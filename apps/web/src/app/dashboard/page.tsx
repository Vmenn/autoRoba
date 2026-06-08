'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { analyticsApi } from '@/lib/api';

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-600',
  OPEN: 'bg-blue-100 text-blue-700',
  ASSIGNED: 'bg-yellow-100 text-yellow-700',
  IN_PROGRESS: 'bg-orange-100 text-orange-700',
  SUBMITTED: 'bg-purple-100 text-purple-700',
  VERIFIED: 'bg-teal-100 text-teal-700',
  CLOSED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
  CANCELLED: 'bg-gray-100 text-gray-400',
  BLOCKED: 'bg-red-100 text-red-600',
  REOPENED: 'bg-indigo-100 text-indigo-700',
};

const BAR_COLORS: Record<string, string> = {
  DRAFT: 'bg-gray-400',
  OPEN: 'bg-blue-400',
  ASSIGNED: 'bg-yellow-400',
  IN_PROGRESS: 'bg-orange-400',
  SUBMITTED: 'bg-purple-400',
  VERIFIED: 'bg-teal-400',
  CLOSED: 'bg-green-500',
  REJECTED: 'bg-red-400',
  CANCELLED: 'bg-gray-300',
  BLOCKED: 'bg-red-600',
  REOPENED: 'bg-indigo-400',
};

function StatCard({ label, value, sub, accent, href }: {
  label: string; value: any; sub?: string; accent?: string; href?: string;
}) {
  const inner = (
    <div className={`bg-white rounded-xl border p-5 space-y-1 ${href ? 'hover:shadow-md transition' : ''}`}>
      <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</div>
      <div className={`text-3xl font-bold ${accent ?? 'text-gray-900'}`}>{value ?? '—'}</div>
      {sub && <div className="text-xs text-gray-400">{sub}</div>}
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analyticsApi
      .dashboard()
      .then(setStats)
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-64 text-gray-400">
        Memuat dashboard...
      </div>
    );
  }

  const s = stats?.summary ?? {};
  const jobsByStatus: any[] = stats?.jobsByStatus ?? [];
  const ncrBySeverity: any[] = stats?.ncrBySeverity ?? [];
  const totalJobs = s.totalJobs || 1;

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">AutoRAB X Enterprise EPC Platform v6.0</p>
      </div>

      {/* Primary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Proyek Aktif" value={s.activeProjects} sub={`${s.totalProjects ?? 0} total`} accent="text-blue-700" href="/dashboard/projects" />
        <StatCard label="Jobs Terbuka" value={s.openJobs} sub={s.overdueJobs > 0 ? `${s.overdueJobs} overdue` : 'Semua on-track'} accent={s.overdueJobs > 0 ? 'text-red-600' : 'text-green-700'} href="/dashboard/jobs" />
        <StatCard label="NCR Terbuka" value={s.openNCRs} sub="OPEN + UNDER_REVIEW" accent={s.openNCRs > 0 ? 'text-orange-600' : 'text-green-700'} href="/dashboard/ncr" />
        <StatCard label="RFI Pending" value={s.openRFIs} sub="Belum direspons" accent={s.openRFIs > 0 ? 'text-yellow-600' : 'text-green-700'} href="/dashboard/rfi" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Klaim Pending" value={s.pendingClaims} sub="Menunggu persetujuan" accent="text-purple-700" href="/dashboard/progress-claims" />
        <StatCard label="Total Jobs" value={s.totalJobs} sub="Semua status" accent="text-gray-700" href="/dashboard/jobs" />
        <StatCard label="Total Proyek" value={s.totalProjects} sub="Semua status" accent="text-gray-700" href="/dashboard/projects" />
        <StatCard label="Analytics & EVM" value="→" sub="SPI · CPI · EAC · VAC" accent="text-brand-700" href="/dashboard/analytics" />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Jobs by Status bar chart */}
        <div className="bg-white rounded-xl border p-6">
          <h2 className="font-semibold text-gray-800 mb-4">Distribusi Status Job</h2>
          {jobsByStatus.length === 0 ? (
            <p className="text-gray-400 text-sm">Belum ada data job</p>
          ) : (
            <div className="space-y-2.5">
              {jobsByStatus
                .sort((a, b) => b.count - a.count)
                .map((j: any) => (
                  <div key={j.status} className="flex items-center gap-3">
                    <div className="text-xs text-gray-600 w-28 truncate">{j.status}</div>
                    <div className="flex-1 bg-gray-100 rounded-full h-2.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${BAR_COLORS[j.status] ?? 'bg-gray-400'}`}
                        style={{ width: `${Math.max(4, (j.count / totalJobs) * 100)}%` }}
                      />
                    </div>
                    <div className="text-sm font-semibold text-gray-700 w-6 text-right">{j.count}</div>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* NCR by Severity */}
        <div className="bg-white rounded-xl border p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold text-gray-800">NCR per Severity</h2>
            <Link href="/dashboard/ncr" className="text-xs text-brand-600 hover:underline">Lihat semua →</Link>
          </div>
          {ncrBySeverity.length === 0 ? (
            <p className="text-gray-400 text-sm">Belum ada NCR — bagus!</p>
          ) : (
            <div className="space-y-3">
              {ncrBySeverity.map((n: any) => (
                <div key={n.severity} className="flex items-center justify-between py-1">
                  <span className={`text-sm font-medium px-3 py-1 rounded-full ${
                    n.severity === 'CRITICAL' ? 'bg-red-100 text-red-700' :
                    n.severity === 'MAJOR' ? 'bg-orange-100 text-orange-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>{n.severity}</span>
                  <span className="font-bold text-gray-700 text-lg">{n.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Jobs */}
      {(stats?.recentJobs?.length ?? 0) > 0 && (
        <div className="bg-white rounded-xl border p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold text-gray-800">Job Terbaru</h2>
            <Link href="/dashboard/jobs" className="text-sm text-brand-600 hover:underline">Lihat semua →</Link>
          </div>
          <div className="divide-y">
            {stats.recentJobs.map((job: any) => (
              <div key={job.id} className="py-3 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="text-sm font-medium text-gray-800 truncate">{job.title}</div>
                  <div className="text-xs text-gray-400 font-mono">{job.jobNo}</div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${STATUS_COLORS[job.status] ?? 'bg-gray-100 text-gray-600'}`}>
                  {job.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Projects */}
      {(stats?.activeProjects?.length ?? 0) > 0 && (
        <div className="bg-white rounded-xl border p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold text-gray-800">Proyek Aktif</h2>
            <Link href="/dashboard/projects" className="text-sm text-brand-600 hover:underline">Lihat semua →</Link>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.activeProjects.map((p: any) => (
              <Link key={p.id} href={`/dashboard/analytics?project=${p.id}`} className="border rounded-lg p-4 space-y-2 hover:shadow-sm transition">
                <div className="font-medium text-gray-800 text-sm truncate">{p.name}</div>
                <div className="text-xs font-mono text-gray-400">{p.code}</div>
                <div className="flex gap-3 text-xs text-gray-500">
                  <span>{p._count?.jobs ?? 0} jobs</span>
                  <span>{p._count?.wbsNodes ?? 0} WBS</span>
                </div>
                {p.contractValue && (
                  <div className="text-sm font-semibold text-brand-700">
                    Rp {new Intl.NumberFormat('id-ID').format(Number(p.contractValue))}
                  </div>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}

      {!stats && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-sm text-yellow-800">
          <strong>Data belum tersedia.</strong> Jalankan DB dan seed terlebih dahulu:
          <code className="ml-2 bg-yellow-100 px-2 py-0.5 rounded font-mono">pnpm db:seed</code>
        </div>
      )}
    </div>
  );
}
