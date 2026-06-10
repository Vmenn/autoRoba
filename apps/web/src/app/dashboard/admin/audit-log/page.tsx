'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface AuditEntry {
  id: string;
  userId: string;
  action: string;
  resource: string;
  resourceId?: string;
  summary?: string;
  ipAddress?: string;
  createdAt: string;
}

const ACTION_COLORS: Record<string, string> = {
  CREATE: 'bg-green-100 text-green-700',
  UPDATE: 'bg-blue-100 text-blue-700',
  DELETE: 'bg-red-100 text-red-700',
  LOGIN: 'bg-purple-100 text-purple-700',
  LOGOUT: 'bg-gray-100 text-gray-600',
};

export default function AuditLogPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [resource, setResource] = useState('');
  const [action, setAction] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (resource) params.set('resource', resource);
      if (action) params.set('action', action);
      const res = await api.get(`/v1/admin/audit-logs?${params}`).then((r) => r.data);
      setEntries(res.items ?? []);
      setTotal(res.total ?? 0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [resource, action]);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Audit Log</h1>
        <p className="text-sm text-gray-500 mt-1">{total} entri log aktivitas</p>
      </div>

      <div className="flex gap-3 mb-4">
        <select value={resource} onChange={(e) => setResource(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
          <option value="">Semua resource</option>
          {['Project', 'Job', 'NCR', 'RFI', 'ProgressClaim', 'Document', 'Equipment', 'PurchaseOrder', 'SafetyIncident', 'VariationOrder', 'SubContract'].map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
        <select value={action} onChange={(e) => setAction(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
          <option value="">Semua aksi</option>
          {['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT'].map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400">Memuat...</div>
      ) : entries.length === 0 ? (
        <div className="text-center py-16 text-gray-400">Tidak ada entri log</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Waktu</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Aksi</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Resource</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Keterangan</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {entries.map((e) => (
                <tr key={e.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                    {new Date(e.createdAt).toLocaleString('id-ID')}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${ACTION_COLORS[e.action] ?? 'bg-gray-100 text-gray-600'}`}>
                      {e.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-700 font-medium">{e.resource}</td>
                  <td className="px-4 py-3 text-gray-500 max-w-sm truncate">{e.summary ?? e.resourceId ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-400 font-mono text-xs">{e.ipAddress ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
