'use client';

import { useState, useEffect } from 'react';
import { leaveApi } from '@/lib/api';

const TYPE_LABELS: Record<string, string> = {
  ANNUAL: 'Cuti Tahunan', SICK: 'Cuti Sakit', EMERGENCY: 'Darurat',
  UNPAID: 'Tidak Dibayar', MATERNITY: 'Melahirkan', PATERNITY: 'Ayah',
};

const STATUS_CFG: Record<string, { label: string; cls: string }> = {
  PENDING:   { label: 'Menunggu',   cls: 'bg-yellow-100 text-yellow-700' },
  APPROVED:  { label: 'Disetujui',  cls: 'bg-green-100 text-green-700' },
  REJECTED:  { label: 'Ditolak',    cls: 'bg-red-100 text-red-700' },
  CANCELLED: { label: 'Dibatalkan', cls: 'bg-gray-100 text-gray-500' },
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function LeaveMgmtPage() {
  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);
  const [rejectModal, setRejectModal] = useState<{ id: string; name: string } | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await leaveApi.pending();
      setItems(res.items ?? []);
      setTotal(res.total ?? 0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const approve = async (id: string) => {
    setActing(id);
    try {
      await leaveApi.review(id, 'APPROVED');
      load();
    } finally {
      setActing(null);
    }
  };

  const reject = async () => {
    if (!rejectModal) return;
    setActing(rejectModal.id);
    try {
      await leaveApi.review(rejectModal.id, 'REJECTED', rejectReason);
      setRejectModal(null);
      setRejectReason('');
      load();
    } finally {
      setActing(null);
    }
  };

  const counts = { total: items.length };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-800">Manajemen Cuti</h1>
        <p className="text-sm text-gray-500 mt-0.5">Approve atau tolak pengajuan cuti karyawan</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-yellow-50 rounded-xl p-4">
          <div className="text-3xl font-black text-yellow-600">{total}</div>
          <div className="text-xs font-semibold text-yellow-700 mt-1">Menunggu Persetujuan</div>
        </div>
      </div>

      {/* List */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="px-5 py-3 border-b">
          <span className="font-semibold text-gray-700 text-sm">{total} pengajuan pending</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48 text-gray-400">Memuat...</div>
        ) : items.length === 0 ? (
          <div className="flex items-center justify-center h-48 text-gray-400">
            Tidak ada pengajuan yang menunggu 🎉
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {items.map((l) => {
              const statusCfg = STATUS_CFG[l.status] ?? STATUS_CFG.PENDING;
              const busy = acting === l.id;
              return (
                <div key={l.id} className="px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-4 hover:bg-gray-50 transition">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-800">
                        {l.user?.firstName} {l.user?.lastName}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${statusCfg.cls}`}>
                        {statusCfg.label}
                      </span>
                    </div>
                    <div className="text-sm text-blue-700 font-medium mt-0.5">
                      {TYPE_LABELS[l.leaveType] ?? l.leaveType}
                    </div>
                    <div className="text-xs text-gray-500 mt-1 space-x-3">
                      <span>📅 {fmtDate(l.startDate)} — {fmtDate(l.endDate)}</span>
                      <span className="font-semibold text-gray-600">{l.totalDays} hari</span>
                    </div>
                    {l.reason && (
                      <div className="text-xs text-gray-400 mt-1 truncate max-w-sm">"{l.reason}"</div>
                    )}
                  </div>

                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => setRejectModal({ id: l.id, name: `${l.user?.firstName} ${l.user?.lastName}` })}
                      disabled={busy}
                      className="px-3 py-1.5 text-sm font-semibold text-red-600 border border-red-200 bg-red-50 rounded-lg hover:bg-red-100 transition disabled:opacity-50">
                      ✕ Tolak
                    </button>
                    <button
                      onClick={() => approve(l.id)}
                      disabled={busy}
                      className="px-3 py-1.5 text-sm font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 transition disabled:opacity-50">
                      {busy ? '...' : '✓ Setujui'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-lg font-bold text-gray-800 mb-1">Tolak Pengajuan Cuti</h2>
            <p className="text-sm text-gray-500 mb-4">
              Tolak pengajuan dari <strong>{rejectModal.name}</strong>
            </p>
            <label className="block text-xs font-medium text-gray-600 mb-1">Alasan Penolakan</label>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              placeholder="Masukkan alasan penolakan..."
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
            />
            <div className="flex gap-3 mt-4">
              <button onClick={() => { setRejectModal(null); setRejectReason(''); }}
                className="flex-1 py-2.5 border rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition">
                Batal
              </button>
              <button onClick={reject}
                disabled={!rejectReason.trim() || !!acting}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 transition disabled:opacity-50">
                Tolak
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
