'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface PTW {
  id: string;
  permitNo: string;
  permitType: string;
  workActivity: string;
  location: string;
  validFrom: string;
  validTo: string;
  status: string;
  project?: { code: string; name: string };
  riskAssessment?: string;
}

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-600',
  PENDING_APPROVAL: 'bg-yellow-100 text-yellow-800',
  APPROVED: 'bg-green-100 text-green-800',
  ACTIVE: 'bg-blue-100 text-blue-800',
  EXPIRED: 'bg-red-100 text-red-700',
  CANCELLED: 'bg-gray-200 text-gray-500',
};

export default function PermitsPage() {
  const [items, setItems] = useState<PTW[]>([]);
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<{ id: string; code: string; name: string }[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    projectId: '', permitType: 'HOT_WORK', workActivity: '',
    location: '', validFrom: '', validTo: '', riskAssessment: '',
  });

  const load = async () => {
    try {
      setLoading(true);
      const [ptwRes, projRes] = await Promise.all([
        api.get('/v1/hse/permits').then((r) => r.data),
        api.get('/v1/projects').then((r) => r.data),
      ]);
      setItems(Array.isArray(ptwRes) ? ptwRes : ptwRes.items ?? []);
      setProjects(projRes.items ?? []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post('/v1/hse/permits', {
      projectId: form.projectId,
      permitType: form.permitType,
      workActivity: form.workActivity,
      location: form.location,
      validFrom: form.validFrom,
      validTo: form.validTo,
      riskAssessment: form.riskAssessment || undefined,
    });
    setShowModal(false);
    setForm({ projectId: '', permitType: 'HOT_WORK', workActivity: '', location: '', validFrom: '', validTo: '', riskAssessment: '' });
    load();
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Permit to Work</h1>
          <p className="text-sm text-gray-500 mt-1">Izin kerja aktif dan riwayat PTW</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-700"
        >
          + Buat PTW Baru
        </button>
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400">Memuat...</div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 text-gray-400">Tidak ada Permit to Work terdaftar</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">No. PTW</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Jenis Permit</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Aktivitas Kerja</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Proyek</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Berlaku</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((ptw) => (
                <tr key={ptw.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{ptw.permitNo}</td>
                  <td className="px-4 py-3 text-gray-700 font-medium">{ptw.permitType.replace(/_/g, ' ')}</td>
                  <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{ptw.workActivity}</td>
                  <td className="px-4 py-3 text-gray-500">{ptw.project?.code ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {new Date(ptw.validFrom).toLocaleDateString('id-ID')} –{' '}
                    {new Date(ptw.validTo).toLocaleDateString('id-ID')}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[ptw.status] ?? 'bg-gray-100'}`}>
                      {ptw.status.replace(/_/g, ' ')}
                    </span>
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
            <h2 className="text-lg font-bold mb-4 text-orange-700">Buat Permit to Work Baru</h2>
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
                  <label className="block text-xs font-medium text-gray-600 mb-1">Jenis Permit *</label>
                  <select value={form.permitType} onChange={(e) => setForm({ ...form, permitType: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                    <option value="HOT_WORK">Hot Work</option>
                    <option value="CONFINED_SPACE">Confined Space</option>
                    <option value="WORKING_AT_HEIGHT">Working at Height</option>
                    <option value="ELECTRICAL">Electrical</option>
                    <option value="EXCAVATION">Excavation</option>
                    <option value="GENERAL">General</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Aktivitas Kerja *</label>
                  <input required value={form.workActivity} onChange={(e) => setForm({ ...form, workActivity: e.target.value })}
                    placeholder="Deskripsikan pekerjaan yang akan dilakukan" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Lokasi *</label>
                  <input required value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div />
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Berlaku Dari *</label>
                  <input required type="datetime-local" value={form.validFrom}
                    onChange={(e) => setForm({ ...form, validFrom: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Berlaku Sampai *</label>
                  <input required type="datetime-local" value={form.validTo}
                    onChange={(e) => setForm({ ...form, validTo: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Penilaian Risiko (JSA/HIRARC)</label>
                  <textarea rows={3} value={form.riskAssessment}
                    onChange={(e) => setForm({ ...form, riskAssessment: e.target.value })}
                    placeholder="Identifikasi bahaya dan pengendalian..." className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm rounded-lg border border-gray-300 hover:bg-gray-50">Batal</button>
                <button type="submit"
                  className="px-4 py-2 text-sm rounded-lg bg-orange-600 text-white hover:bg-orange-700">Buat PTW</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
