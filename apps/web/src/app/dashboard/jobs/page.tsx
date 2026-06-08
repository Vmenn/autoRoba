'use client';

import { useState, useEffect } from 'react';
import { jobApi } from '@/lib/api';

const STATUSES = ['DRAFT', 'OPEN', 'ASSIGNED', 'IN_PROGRESS', 'SUBMITTED', 'VERIFIED', 'CLOSED'];

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

const PRIORITY_COLORS: Record<string, string> = {
  LOW: 'text-gray-400',
  MEDIUM: 'text-blue-500',
  HIGH: 'text-orange-500',
  CRITICAL: 'text-red-600',
};

function JobCard({ job }: { job: any }) {
  const isOverdue =
    job.dueDate &&
    new Date(job.dueDate) < new Date() &&
    !['CLOSED', 'CANCELLED'].includes(job.status);

  return (
    <div className={`bg-white rounded-xl border p-4 space-y-2 ${isOverdue ? 'border-red-300' : ''}`}>
      <div className="flex justify-between items-start gap-2">
        <div>
          <div className="font-medium text-gray-800 text-sm">{job.title}</div>
          <div className="text-xs text-gray-400 font-mono mt-0.5">{job.jobNo}</div>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${STATUS_COLORS[job.status]}`}>
          {job.status}
        </span>
      </div>
      <div className="flex items-center gap-3 text-xs text-gray-500">
        <span className={`font-semibold ${PRIORITY_COLORS[job.priority]}`}>
          {job.priority}
        </span>
        <span>{job.type}</span>
        {job.dueDate && (
          <span className={isOverdue ? 'text-red-600 font-semibold' : ''}>
            Due: {new Date(job.dueDate).toLocaleDateString('id-ID')}
          </span>
        )}
      </div>
    </div>
  );
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<any>({ items: [], total: 0 });
  const [activeStatus, setActiveStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    jobApi
      .list({ status: activeStatus ?? undefined, limit: 50 })
      .then(setJobs)
      .finally(() => setLoading(false));
  }, [activeStatus]);

  // Group by status for kanban
  const byStatus = STATUSES.reduce((acc, s) => {
    acc[s] = jobs.items?.filter((j: any) => j.status === s) ?? [];
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Job & Task Management</h1>
          <p className="text-gray-500 mt-1">
            Total: {jobs.total} jobs · State machine §12.3
          </p>
        </div>
      </div>

      {/* Status filter pills */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setActiveStatus(null)}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
            activeStatus === null ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Semua ({jobs.total})
        </button>
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setActiveStatus(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
              activeStatus === s
                ? 'bg-brand-600 text-white'
                : `${STATUS_COLORS[s]} hover:opacity-80`
            }`}
          >
            {s} ({byStatus[s]?.length ?? 0})
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-gray-400 text-sm">Memuat jobs...</div>
      ) : jobs.items?.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-4xl mb-2">✅</div>
          <div>Belum ada job. Buat job pertama via API atau dari NCR/PO/RFI.</div>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {jobs.items.map((job: any) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
        <strong>State Machine §12.3:</strong>{' '}
        DRAFT → OPEN → ASSIGNED → IN_PROGRESS → SUBMITTED → VERIFIED → CLOSED.
        Gunakan API <code className="font-mono bg-blue-100 px-1 rounded">PATCH /v1/jobs/:id/status</code> untuk transisi.
        Setiap transisi dicatat di audit trail dengan aktor, waktu, dan catatan.
      </div>
    </div>
  );
}
