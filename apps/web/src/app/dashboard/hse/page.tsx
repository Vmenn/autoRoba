'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface Incident {
  id: string;
  incidentNo: string;
  title: string;
  incidentDate: string;
  location: string;
  severity: string;
  status: string;
  injuredPersons: number;
  lostTimeDays: number;
  project?: { code: string; name: string };
}

interface HSEStats {
  totalIncidents: number;
  bySeverity: { severity: string; count: number }[];
  totalLostDays: number;
  totalInjured: number;
}

const SEVERITY_COLORS: Record<string, string> = {
  NEAR_MISS: 'bg-yellow-100 text-yellow-800',
  FIRST_AID: 'bg-orange-100 text-orange-800',
  MEDICAL_TREATMENT: 'bg-red-100 text-red-700',
  LOST_TIME: 'bg-red-200 text-red-900',
  FATALITY: 'bg-gray-900 text-white',
};

const STATUS_COLORS: Record<string, string> = {
  OPEN: 'bg-red-100 text-red-800',
  INVESTIGATING: 'bg-yellow-100 text-yellow-800',
  CLOSED: 'bg-green-100 text-green-800',
};

export default function HSEPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [stats, setStats] = useState<HSEStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<{ id: string; code: string; name: string }[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    projectId: '', title: '', description: '', incidentDate: '',
    location: '', severity: 'NEAR_MISS', injuredPersons: '0', lostTimeDays: '0',
  });

  const load = async () => {
    try {
      setLoading(true);
      const [incRes, statsRes, projRes] = await Promise.all([
        api.get('/v1/hse/incidents').then((r) => r.data),
        api.get('/v1/hse/stats').then((r) => r.data),
        api.get('/v1/projects').then((r) => r.data),
      ]);
      setIncidents(incRes.items ?? []);
      setStats(statsRes);
      setProjects(projRes.items ?? []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post('/v1/hse/incidents', {
      projectId: form.projectId,
      title: form.title,
      description: form.description,
      incidentDate: form.incidentDate,
      location: form.location,
      severity: form.severity,
      injuredPersons: Number(form.injuredPersons),
      lostTimeDays: Number(form.lostTimeDays),
    });
    setShowModal(false);
    setForm({ projectId: '', title: '', description: '', incidentDate: '', location: '', severity: 'NEAR_MISS', injuredPersons: '0', lostTimeDays: '0' });
    load();
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">K3 & Insiden HSE</h1>
          <p className="text-sm text-gray-500 mt-1">Health, Safety & Environment</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700"
        >
          + Lapor Insiden
        </button>
      </div>

      {stats && (
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="text-xs text-gray-500 mb-1">Total Insiden</div>
            <div className="text-3xl font-bold text-gray-900">{stats.totalIncidents}</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="text-xs text-gray-500 mb-1">Total Hari Hilang</div>
            <div className="text-3xl font-bold text-orange-600">{stats.totalLostDays}</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="text-xs text-gray-500 mb-1">Total Terluka</div>
            <div className="text-3xl font-bold text-red-600">{stats.totalInjured}</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="text-xs text-gray-500 mb-2">Per Keparahan</div>
            <div className="space-y-1">
              {stats.bySeverity.map((s) => (
                <div key={s.severity} className="flex justify-between text-xs">
                  <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${SEVERITY_COLORS[s.severity] ?? 'bg-gray-100'}`}>
                    {s.severity.replace('_', ' ')}
                  </span>
                  <span className="font-bold">{s.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-16 text-gray-400">Memuat...</div>
      ) : incidents.length === 0 ? (
        <div className="text-center py-16 text-gray-400">Tidak ada insiden tercatat — pertahankan rekor ini!</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">No. Insiden</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Judul</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Proyek</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Tanggal</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Keparahan</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Status</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-600">Hari Hilang</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {incidents.map((inc) => (
                <tr key={inc.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{inc.incidentNo}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{inc.title}</td>
                  <td className="px-4 py-3 text-gray-500">{inc.project?.code ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{new Date(inc.incidentDate).toLocaleDateString('id-ID')}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${SEVERITY_COLORS[inc.severity] ?? 'bg-gray-100'}`}>
                      {inc.severity.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[inc.status] ?? 'bg-gray-100'}`}>
                      {inc.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-gray-700">{inc.lostTimeDays}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
            <h2 className="text-lg font-bold mb-4 text-red-700">Lapor Insiden K3</h2>
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
                  <label className="block text-xs font-medium text-gray-600 mb-1">Tanggal Insiden *</label>
                  <input required type="date" value={form.incidentDate} onChange={(e) => setForm({ ...form, incidentDate: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Judul *</label>
                  <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="Ringkasan singkat insiden" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Deskripsi *</label>
                  <textarea required rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Lokasi *</label>
                  <input required value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Keparahan *</label>
                  <select value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                    <option value="NEAR_MISS">Near Miss</option>
                    <option value="FIRST_AID">First Aid</option>
                    <option value="MEDICAL_TREATMENT">Medical Treatment</option>
                    <option value="LOST_TIME">Lost Time Injury</option>
                    <option value="FATALITY">Fatality</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Jumlah Terluka</label>
                  <input type="number" min="0" value={form.injuredPersons}
                    onChange={(e) => setForm({ ...form, injuredPersons: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Hari Hilang</label>
                  <input type="number" min="0" value={form.lostTimeDays}
                    onChange={(e) => setForm({ ...form, lostTimeDays: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm rounded-lg border border-gray-300 hover:bg-gray-50">Batal</button>
                <button type="submit"
                  className="px-4 py-2 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700">Lapor Insiden</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
