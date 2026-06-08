'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { projectApi, jobApi } from '@/lib/api';

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-white rounded-xl border p-5">
      <div className="text-sm text-gray-500">{label}</div>
      <div className="text-3xl font-bold text-gray-900 mt-1">{value}</div>
      {sub && <div className="text-xs text-gray-400 mt-1">{sub}</div>}
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any>({ total: 0, items: [] });

  useEffect(() => {
    projectApi.list().then(setProjects).catch(console.error);
    jobApi.list({ limit: 5 }).then(setJobs).catch(console.error);
  }, []);

  const openJobs = jobs.items?.filter((j: any) =>
    ['OPEN', 'ASSIGNED', 'IN_PROGRESS'].includes(j.status),
  ).length ?? 0;

  const overdueJobs = jobs.items?.filter(
    (j: any) =>
      j.dueDate &&
      new Date(j.dueDate) < new Date() &&
      !['CLOSED', 'CANCELLED'].includes(j.status),
  ).length ?? 0;

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Selamat datang, {user?.firstName}
        </h1>
        <p className="text-gray-500 mt-1">Dashboard AutoRAB X — Enterprise EPC Platform</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Proyek" value={projects.length} sub="aktif & draft" />
        <StatCard label="Open Jobs" value={openJobs} sub="open + in-progress" />
        <StatCard label="Overdue" value={overdueJobs} sub="lewat due date" />
        <StatCard label="Total Jobs" value={jobs.total ?? 0} />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border p-5">
          <h2 className="font-semibold text-gray-800 mb-4">Proyek Terbaru</h2>
          {projects.length === 0 ? (
            <p className="text-gray-400 text-sm">Belum ada proyek</p>
          ) : (
            <ul className="space-y-2">
              {projects.slice(0, 5).map((p: any) => (
                <li key={p.id} className="flex justify-between text-sm">
                  <span className="text-gray-800 font-medium">{p.name}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium
                    ${p.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                    {p.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-white rounded-xl border p-5">
          <h2 className="font-semibold text-gray-800 mb-4">Jobs Terbaru</h2>
          {jobs.items?.length === 0 ? (
            <p className="text-gray-400 text-sm">Belum ada job</p>
          ) : (
            <ul className="space-y-2">
              {jobs.items?.slice(0, 5).map((j: any) => (
                <li key={j.id} className="flex justify-between text-sm">
                  <span className="text-gray-800 font-medium truncate max-w-[180px]">{j.title}</span>
                  <StatusBadge status={j.status} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="bg-brand-50 border border-brand-200 rounded-xl p-5 text-sm text-brand-800">
        <strong>Fase 0–1 MVP aktif:</strong> AHSP Engine (SE DJBK 68/2024), Tax Engine (PP 9/2022),
        RAB/RAP Engine, Job &amp; Task Management, WBS Engine, Multi-Tenant Auth/RBAC.
        Gunakan menu di kiri untuk menjelajah fitur.
      </div>
    </div>
  );
}

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
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  );
}
