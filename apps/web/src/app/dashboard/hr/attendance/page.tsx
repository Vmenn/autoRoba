'use client';

import { useState, useEffect } from 'react';
import { attendanceApi } from '@/lib/api';

const STATUS_CFG: Record<string, { label: string; cls: string }> = {
  PRESENT:  { label: 'Hadir',      cls: 'bg-green-100 text-green-700' },
  LATE:     { label: 'Terlambat',  cls: 'bg-yellow-100 text-yellow-700' },
  ABSENT:   { label: 'Absen',      cls: 'bg-red-100 text-red-700' },
  HALF_DAY: { label: 'Setengah',   cls: 'bg-purple-100 text-purple-700' },
  ON_LEAVE: { label: 'Cuti',       cls: 'bg-blue-100 text-blue-700' },
};

function fmtTime(iso?: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function AttendanceReportPage() {
  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState(() => {
    const d = new Date(); d.setDate(1);
    return d.toISOString().slice(0, 10);
  });
  const [to, setTo] = useState(() => new Date().toISOString().slice(0, 10));

  const load = async () => {
    setLoading(true);
    try {
      const res = await attendanceApi.report({ from, to });
      setItems(res.items ?? []);
      setTotal(res.total ?? 0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const counts = items.reduce((acc, a) => {
    acc[a.status] = (acc[a.status] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Rekap Absensi</h1>
          <p className="text-sm text-gray-500 mt-0.5">Laporan kehadiran seluruh karyawan</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border p-4 flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Dari Tanggal</label>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Sampai Tanggal</label>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <button onClick={load}
          className="px-4 py-2 bg-blue-900 text-white rounded-lg text-sm font-medium hover:bg-blue-800 transition">
          Tampilkan
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { key: 'PRESENT', label: 'Hadir', color: 'text-green-600 bg-green-50' },
          { key: 'LATE', label: 'Terlambat', color: 'text-yellow-600 bg-yellow-50' },
          { key: 'ABSENT', label: 'Absen', color: 'text-red-600 bg-red-50' },
          { key: 'HALF_DAY', label: 'Setengah Hari', color: 'text-purple-600 bg-purple-50' },
          { key: 'ON_LEAVE', label: 'Cuti', color: 'text-blue-600 bg-blue-50' },
        ].map((s) => (
          <div key={s.key} className={`rounded-xl p-4 ${s.color}`}>
            <div className="text-2xl font-black">{counts[s.key] ?? 0}</div>
            <div className="text-xs font-semibold mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="px-5 py-3 border-b flex items-center justify-between">
          <span className="font-semibold text-gray-700">Total: {total} record</span>
        </div>
        {loading ? (
          <div className="flex items-center justify-center h-48 text-gray-400">Memuat...</div>
        ) : items.length === 0 ? (
          <div className="flex items-center justify-center h-48 text-gray-400">Tidak ada data</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                <tr>
                  <th className="px-4 py-3 text-left">Karyawan</th>
                  <th className="px-4 py-3 text-left">Tanggal</th>
                  <th className="px-4 py-3 text-left">Check-In</th>
                  <th className="px-4 py-3 text-left">Check-Out</th>
                  <th className="px-4 py-3 text-left">Proyek</th>
                  <th className="px-4 py-3 text-left">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((a) => {
                  const cfg = STATUS_CFG[a.status] ?? { label: a.status, cls: 'bg-gray-100 text-gray-600' };
                  return (
                    <tr key={a.id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-800">{a.user?.firstName} {a.user?.lastName}</div>
                        <div className="text-xs text-gray-400">{a.user?.email}</div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{fmtDate(a.date)}</td>
                      <td className="px-4 py-3 font-mono text-gray-700">{fmtTime(a.checkInTime)}</td>
                      <td className="px-4 py-3 font-mono text-gray-700">{fmtTime(a.checkOutTime)}</td>
                      <td className="px-4 py-3 text-xs text-gray-500">{a.project?.code ?? '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${cfg.cls}`}>{cfg.label}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
