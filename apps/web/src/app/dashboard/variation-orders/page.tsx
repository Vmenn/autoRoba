'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface VO {
  id: string;
  voNumber: string;
  title: string;
  type: string;
  status: string;
  valueRAB: number;
  valueRAP: number;
  impactDays: number;
  project?: { code: string; name: string };
  createdAt: string;
}

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-600',
  SUBMITTED: 'bg-blue-100 text-blue-800',
  APPROVED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-700',
  VOID: 'bg-gray-200 text-gray-500',
};

const TYPE_LABELS: Record<string, string> = {
  SCOPE_CHANGE: 'Perubahan Lingkup',
  DESIGN_CHANGE: 'Perubahan Desain',
  SITE_CONDITION: 'Kondisi Lapangan',
  CLIENT_REQUEST: 'Permintaan Klien',
  FORCE_MAJEURE: 'Force Majeure',
  OTHER: 'Lainnya',
};

export default function VariationOrdersPage() {
  const [items, setItems] = useState<VO[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<{ id: string; code: string; name: string }[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    projectId: '', title: '', description: '', type: 'SCOPE_CHANGE',
    valueRAB: '', valueRAP: '', impactDays: '0',
  });

  const load = async () => {
    try {
      setLoading(true);
      const [voRes, projRes] = await Promise.all([
        api.get('/v1/variation-orders').then((r) => r.data),
        api.get('/v1/projects').then((r) => r.data),
      ]);
      setItems(voRes.items ?? []);
      setTotal(voRes.total ?? 0);
      setProjects(projRes.items ?? []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post('/v1/variation-orders', {
      projectId: form.projectId, title: form.title, description: form.description,
      type: form.type,
      valueRAB: form.valueRAB ? Number(form.valueRAB) : 0,
      valueRAP: form.valueRAP ? Number(form.valueRAP) : 0,
      impactDays: Number(form.impactDays),
    });
    setShowModal(false);
    setForm({ projectId: '', title: '', description: '', type: 'SCOPE_CHANGE', valueRAB: '', valueRAP: '', impactDays: '0' });
    load();
  };

  const submitVO = async (id: string) => {
    await api.patch(`/v1/variation-orders/${id}/submit`);
    load();
  };

  const approveVO = async (id: string) => {
    await api.patch(`/v1/variation-orders/${id}/approve`);
    load();
  };

  const netImpact = items.filter((v) => v.status === 'APPROVED').reduce((s, v) => s + Number(v.valueRAB), 0);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Variation Orders</h1>
          <p className="text-sm text-gray-500 mt-1">{total} VO • Net nilai disetujui: Rp {netImpact.toLocaleString('id-ID')}</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
          + Buat VO Baru
        </button>
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400">Memuat...</div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 text-gray-400">Belum ada Variation Order</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">No. VO</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Judul</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Jenis</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Proyek</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Status</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-600">Nilai RAB (Rp)</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-600">Dampak Hari</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((vo) => (
                <tr key={vo.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{vo.voNumber}</td>
                  <td className="px-4 py-3 font-medium text-gray-900 max-w-xs truncate">{vo.title}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{TYPE_LABELS[vo.type] ?? vo.type}</td>
                  <td className="px-4 py-3 text-gray-500">{vo.project?.code ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[vo.status] ?? 'bg-gray-100'}`}>
                      {vo.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">{Number(vo.valueRAB).toLocaleString('id-ID')}</td>
                  <td className="px-4 py-3 text-right">{vo.impactDays > 0 ? `+${vo.impactDays}` : vo.impactDays}</td>
                  <td className="px-4 py-3">
                    {vo.status === 'DRAFT' && (
                      <button onClick={() => submitVO(vo.id)}
                        className="text-xs text-blue-600 hover:text-blue-800 mr-2">Submit</button>
                    )}
                    {vo.status === 'SUBMITTED' && (
                      <button onClick={() => approveVO(vo.id)}
                        className="text-xs text-green-600 hover:text-green-800">Approve</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
            <h2 className="text-lg font-bold mb-4">Buat Variation Order</h2>
            <form onSubmit={submit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Proyek *</label>
                  <select required value={form.projectId} onChange={(e) => setForm({ ...form, projectId: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                    <option value="">Pilih proyek...</option>
                    {projects.map((p) => <option key={p.id} value={p.id}>{p.code} — {p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Jenis VO *</label>
                  <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                    {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Judul *</label>
                  <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Deskripsi *</label>
                  <textarea required rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Nilai RAB (Rp)</label>
                  <input type="number" value={form.valueRAB} onChange={(e) => setForm({ ...form, valueRAB: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Nilai RAP (Rp)</label>
                  <input type="number" value={form.valueRAP} onChange={(e) => setForm({ ...form, valueRAP: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Dampak Waktu (hari)</label>
                  <input type="number" value={form.impactDays} onChange={(e) => setForm({ ...form, impactDays: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm rounded-lg border border-gray-300 hover:bg-gray-50">Batal</button>
                <button type="submit"
                  className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700">Simpan Draft</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
