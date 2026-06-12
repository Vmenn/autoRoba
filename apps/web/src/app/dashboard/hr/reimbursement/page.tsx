'use client';

import { useState, useEffect } from 'react';
import { hrReimbApi } from '@/lib/api';

const CAT_LABELS: Record<string, string> = {
  TRANSPORT: '🚗 Transport', ACCOMMODATION: '🏨 Penginapan', MEAL: '🍽 Makan',
  OFFICE_SUPPLY: '📎 ATK', COMMUNICATION: '📱 Komunikasi', OTHER: '📦 Lainnya',
};

const STATUS_CFG: Record<string, { label: string; cls: string }> = {
  DRAFT:     { label: 'Draft',      cls: 'bg-gray-100 text-gray-500' },
  SUBMITTED: { label: 'Diajukan',   cls: 'bg-blue-100 text-blue-700' },
  APPROVED:  { label: 'Disetujui',  cls: 'bg-green-100 text-green-700' },
  REJECTED:  { label: 'Ditolak',    cls: 'bg-red-100 text-red-700' },
  PAID:      { label: 'Dibayar',    cls: 'bg-purple-100 text-purple-700' },
};

const STATUSES = ['ALL', 'SUBMITTED', 'APPROVED', 'REJECTED', 'PAID'];

const IDR = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function ReimbMgmtPage() {
  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [acting, setActing] = useState<string | null>(null);
  const [rejectModal, setRejectModal] = useState<{ id: string; name: string; amount: number } | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const params = filter !== 'ALL' ? { status: filter } : {};
      const res = await hrReimbApi.all(params);
      setItems(res.items ?? []);
      setTotal(res.total ?? 0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [filter]);

  const approve = async (id: string) => {
    setActing(id);
    try { await hrReimbApi.review(id, 'APPROVED'); load(); }
    finally { setActing(null); }
  };

  const reject = async () => {
    if (!rejectModal) return;
    setActing(rejectModal.id);
    try {
      await hrReimbApi.review(rejectModal.id, 'REJECTED', rejectReason);
      setRejectModal(null); setRejectReason(''); load();
    } finally { setActing(null); }
  };

  const markPaid = async (id: string) => {
    setActing(id);
    try { await hrReimbApi.markPaid(id); load(); }
    finally { setActing(null); }
  };

  const totalAmt = items.reduce((s, r) => s + Number(r.amount ?? 0), 0);
  const submittedAmt = items.filter(r => r.status === 'SUBMITTED').reduce((s, r) => s + Number(r.amount ?? 0), 0);
  const paidAmt = items.filter(r => r.status === 'PAID').reduce((s, r) => s + Number(r.amount ?? 0), 0);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-800">Manajemen Reimbursement</h1>
        <p className="text-sm text-gray-500 mt-0.5">Review, approve, dan tandai pembayaran reimburse karyawan</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-blue-50 rounded-xl p-4">
          <div className="text-2xl font-black text-blue-700">{IDR.format(submittedAmt)}</div>
          <div className="text-xs font-semibold text-blue-600 mt-1">Menunggu Review</div>
        </div>
        <div className="bg-green-50 rounded-xl p-4">
          <div className="text-2xl font-black text-green-700">{IDR.format(totalAmt)}</div>
          <div className="text-xs font-semibold text-green-600 mt-1">Total Diajukan ({total} item)</div>
        </div>
        <div className="bg-purple-50 rounded-xl p-4">
          <div className="text-2xl font-black text-purple-700">{IDR.format(paidAmt)}</div>
          <div className="text-xs font-semibold text-purple-600 mt-1">Total Dibayarkan</div>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {STATUSES.map((s) => (
          <button key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
              filter === s ? 'bg-blue-900 text-white' : 'bg-white border text-gray-600 hover:bg-gray-50'
            }`}>
            {STATUS_CFG[s]?.label ?? 'Semua'}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border overflow-hidden">
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
                  <th className="px-4 py-3 text-left">Kategori</th>
                  <th className="px-4 py-3 text-right">Jumlah</th>
                  <th className="px-4 py-3 text-left">Tanggal</th>
                  <th className="px-4 py-3 text-left">Klaim #</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((r) => {
                  const cfg = STATUS_CFG[r.status] ?? STATUS_CFG.DRAFT;
                  const busy = acting === r.id;
                  return (
                    <tr key={r.id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-800">{r.user?.firstName} {r.user?.lastName}</div>
                        <div className="text-xs text-gray-400">{r.user?.email}</div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{CAT_LABELS[r.category] ?? r.category}</td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-800">
                        {IDR.format(Number(r.amount))}
                      </td>
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{fmtDate(r.expenseDate)}</td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-400">{r.claimNo}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${cfg.cls}`}>{cfg.label}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1.5 justify-center">
                          {r.status === 'SUBMITTED' && (
                            <>
                              <button
                                onClick={() => setRejectModal({ id: r.id, name: `${r.user?.firstName} ${r.user?.lastName}`, amount: Number(r.amount) })}
                                disabled={busy}
                                className="px-2 py-1 text-xs font-semibold text-red-600 border border-red-200 bg-red-50 rounded-md hover:bg-red-100 disabled:opacity-50">
                                Tolak
                              </button>
                              <button
                                onClick={() => approve(r.id)}
                                disabled={busy}
                                className="px-2 py-1 text-xs font-semibold text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50">
                                {busy ? '...' : 'Setujui'}
                              </button>
                            </>
                          )}
                          {r.status === 'APPROVED' && (
                            <button
                              onClick={() => markPaid(r.id)}
                              disabled={busy}
                              className="px-2 py-1 text-xs font-semibold text-white bg-purple-600 rounded-md hover:bg-purple-700 disabled:opacity-50">
                              {busy ? '...' : '💸 Bayar'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-lg font-bold text-gray-800 mb-1">Tolak Reimburse</h2>
            <p className="text-sm text-gray-500 mb-1">
              <strong>{rejectModal.name}</strong>
            </p>
            <p className="text-lg font-bold text-gray-700 mb-4">{IDR.format(rejectModal.amount)}</p>
            <label className="block text-xs font-medium text-gray-600 mb-1">Alasan Penolakan</label>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              placeholder="Masukkan alasan..."
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
            />
            <div className="flex gap-3 mt-4">
              <button onClick={() => { setRejectModal(null); setRejectReason(''); }}
                className="flex-1 py-2.5 border rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50">
                Batal
              </button>
              <button onClick={reject} disabled={!rejectReason.trim() || !!acting}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 disabled:opacity-50">
                Tolak
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
