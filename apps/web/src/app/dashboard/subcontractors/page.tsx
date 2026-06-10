'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface Subcontractor {
  id: string;
  code: string;
  name: string;
  email?: string;
  phone?: string;
  npwp?: string;
  pkp: boolean;
  grade?: string;
  isActive: boolean;
  _count?: { contracts: number };
}

interface SPK {
  id: string;
  spkNumber: string;
  title: string;
  status: string;
  contractValue: number;
  startDate: string;
  endDate: string;
  retention: number;
  project?: { code: string; name: string };
  subcontractor?: { code: string; name: string };
  _count?: { claims: number };
}

const SPK_STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-800',
  COMPLETED: 'bg-blue-100 text-blue-800',
  TERMINATED: 'bg-red-100 text-red-700',
  SUSPENDED: 'bg-yellow-100 text-yellow-800',
};

export default function SubcontractorsPage() {
  const [subs, setSubs] = useState<Subcontractor[]>([]);
  const [spks, setSPKs] = useState<SPK[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<{ id: string; code: string; name: string }[]>([]);
  const [tab, setTab] = useState<'spk' | 'subs'>('spk');
  const [showSubModal, setShowSubModal] = useState(false);
  const [showSPKModal, setShowSPKModal] = useState(false);
  const [subForm, setSubForm] = useState({ code: '', name: '', email: '', phone: '', npwp: '', grade: '' });
  const [spkForm, setSpkForm] = useState({
    projectId: '', subcontractorId: '', title: '', scopeOfWork: '',
    contractValue: '', startDate: '', endDate: '', retention: '5',
  });

  const load = async () => {
    try {
      setLoading(true);
      const [subRes, spkRes, projRes] = await Promise.all([
        api.get('/v1/subcontractors').then((r) => r.data),
        api.get('/v1/subcontractors/spk').then((r) => r.data),
        api.get('/v1/projects').then((r) => r.data),
      ]);
      setSubs(Array.isArray(subRes) ? subRes : []);
      setSPKs(spkRes.items ?? []);
      setTotal(spkRes.total ?? 0);
      setProjects(projRes.items ?? []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const submitSub = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post('/v1/subcontractors', {
      code: subForm.code, name: subForm.name,
      email: subForm.email || undefined, phone: subForm.phone || undefined,
      npwp: subForm.npwp || undefined, grade: subForm.grade || undefined,
    });
    setShowSubModal(false);
    setSubForm({ code: '', name: '', email: '', phone: '', npwp: '', grade: '' });
    load();
  };

  const submitSPK = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post('/v1/subcontractors/spk', {
      projectId: spkForm.projectId, subcontractorId: spkForm.subcontractorId,
      title: spkForm.title, scopeOfWork: spkForm.scopeOfWork,
      contractValue: Number(spkForm.contractValue),
      startDate: spkForm.startDate, endDate: spkForm.endDate,
      retention: Number(spkForm.retention),
    });
    setShowSPKModal(false);
    setSpkForm({ projectId: '', subcontractorId: '', title: '', scopeOfWork: '', contractValue: '', startDate: '', endDate: '', retention: '5' });
    load();
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Subkontraktor & SPK</h1>
          <p className="text-sm text-gray-500 mt-1">{subs.length} subkontraktor • {total} SPK</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowSubModal(true)}
            className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50">
            + Subkontraktor
          </button>
          <button onClick={() => setShowSPKModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
            + Buat SPK
          </button>
        </div>
      </div>

      <div className="flex gap-1 mb-4 bg-gray-100 rounded-lg p-1 w-fit">
        {(['spk', 'subs'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${tab === t ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}>
            {t === 'spk' ? `SPK (${total})` : `Subkontraktor (${subs.length})`}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400">Memuat...</div>
      ) : tab === 'spk' ? (
        spks.length === 0 ? (
          <div className="text-center py-16 text-gray-400">Belum ada SPK</div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">No. SPK</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Judul</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Subkontraktor</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Proyek</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Status</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-600">Nilai Kontrak</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-600">Retensi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {spks.map((spk) => (
                  <tr key={spk.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{spk.spkNumber}</td>
                    <td className="px-4 py-3 font-medium text-gray-900 max-w-xs truncate">{spk.title}</td>
                    <td className="px-4 py-3 text-gray-600">{spk.subcontractor?.name ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-500">{spk.project?.code ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${SPK_STATUS_COLORS[spk.status] ?? 'bg-gray-100'}`}>
                        {spk.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-medium">Rp {Number(spk.contractValue).toLocaleString('id-ID')}</td>
                    <td className="px-4 py-3 text-right text-gray-500">{spk.retention}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : (
        subs.length === 0 ? (
          <div className="text-center py-16 text-gray-400">Belum ada subkontraktor terdaftar</div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Kode</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Nama</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">NPWP</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">PKP</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Grade</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-600">Total SPK</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {subs.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs">{s.code}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{s.name}</td>
                    <td className="px-4 py-3 text-gray-500 font-mono text-xs">{s.npwp ?? '—'}</td>
                    <td className="px-4 py-3">{s.pkp ? <span className="text-green-600 font-medium text-xs">PKP</span> : <span className="text-gray-400 text-xs">Non-PKP</span>}</td>
                    <td className="px-4 py-3 text-gray-500">{s.grade ?? '—'}</td>
                    <td className="px-4 py-3 text-right text-gray-700">{s._count?.contracts ?? 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {showSubModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold mb-4">Daftarkan Subkontraktor</h2>
            <form onSubmit={submitSub} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Kode *</label>
                  <input required value={subForm.code} onChange={(e) => setSubForm({ ...subForm, code: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Grade</label>
                  <input value={subForm.grade} onChange={(e) => setSubForm({ ...subForm, grade: e.target.value })}
                    placeholder="K1, K2, M1..." className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Nama *</label>
                  <input required value={subForm.name} onChange={(e) => setSubForm({ ...subForm, name: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
                  <input type="email" value={subForm.email} onChange={(e) => setSubForm({ ...subForm, email: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Telepon</label>
                  <input value={subForm.phone} onChange={(e) => setSubForm({ ...subForm, phone: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">NPWP</label>
                  <input value={subForm.npwp} onChange={(e) => setSubForm({ ...subForm, npwp: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono" />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowSubModal(false)}
                  className="px-4 py-2 text-sm rounded-lg border border-gray-300 hover:bg-gray-50">Batal</button>
                <button type="submit"
                  className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700">Daftarkan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showSPKModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
            <h2 className="text-lg font-bold mb-4">Buat SPK Baru</h2>
            <form onSubmit={submitSPK} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Proyek *</label>
                  <select required value={spkForm.projectId} onChange={(e) => setSpkForm({ ...spkForm, projectId: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                    <option value="">Pilih proyek...</option>
                    {projects.map((p) => <option key={p.id} value={p.id}>{p.code} — {p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Subkontraktor *</label>
                  <select required value={spkForm.subcontractorId} onChange={(e) => setSpkForm({ ...spkForm, subcontractorId: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                    <option value="">Pilih subkontraktor...</option>
                    {subs.map((s) => <option key={s.id} value={s.id}>{s.code} — {s.name}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Judul SPK *</label>
                  <input required value={spkForm.title} onChange={(e) => setSpkForm({ ...spkForm, title: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Lingkup Pekerjaan *</label>
                  <textarea required rows={3} value={spkForm.scopeOfWork} onChange={(e) => setSpkForm({ ...spkForm, scopeOfWork: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Nilai Kontrak (Rp) *</label>
                  <input required type="number" value={spkForm.contractValue} onChange={(e) => setSpkForm({ ...spkForm, contractValue: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Retensi (%)</label>
                  <input type="number" value={spkForm.retention} onChange={(e) => setSpkForm({ ...spkForm, retention: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Tanggal Mulai *</label>
                  <input required type="date" value={spkForm.startDate} onChange={(e) => setSpkForm({ ...spkForm, startDate: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Tanggal Selesai *</label>
                  <input required type="date" value={spkForm.endDate} onChange={(e) => setSpkForm({ ...spkForm, endDate: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowSPKModal(false)}
                  className="px-4 py-2 text-sm rounded-lg border border-gray-300 hover:bg-gray-50">Batal</button>
                <button type="submit"
                  className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700">Buat SPK</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
