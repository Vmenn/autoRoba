'use client';

import { useState, useEffect } from 'react';
import { ncrApi, projectApi } from '@/lib/api';

const STATUS_COLORS: Record<string, string> = {
  OPEN: 'bg-red-100 text-red-700',
  UNDER_REVIEW: 'bg-yellow-100 text-yellow-700',
  AWAITING_CLOSURE: 'bg-blue-100 text-blue-700',
  CLOSED: 'bg-green-100 text-green-700',
  VOID: 'bg-gray-100 text-gray-400',
};

const SEVERITY_COLORS: Record<string, string> = {
  MINOR: 'bg-yellow-50 border-yellow-300 text-yellow-700',
  MAJOR: 'bg-orange-50 border-orange-300 text-orange-700',
  CRITICAL: 'bg-red-50 border-red-300 text-red-700',
};

type NCR = {
  id: string; ncrNo: string; title: string; description: string;
  category: string; severity: string; status: string; location?: string;
  discipline?: string; raisedAt: string; dueDate?: string;
  project?: { code: string; name: string };
};

export default function NCRPage() {
  const [ncrs, setNcrs] = useState<{ items: NCR[]; total: number }>({ items: [], total: 0 });
  const [projects, setProjects] = useState<any[]>([]);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterProject, setFilterProject] = useState('');
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [selected, setSelected] = useState<NCR | null>(null);
  const [form, setForm] = useState({ projectId: '', title: '', description: '', category: 'Workmanship', severity: 'MINOR', location: '', discipline: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    ncrApi.list({ status: filterStatus || undefined, projectId: filterProject || undefined })
      .then(setNcrs).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [filterStatus, filterProject]);
  useEffect(() => { projectApi.list().then(setProjects).catch(console.error); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      await ncrApi.create(form);
      setShowCreate(false);
      setForm({ projectId: '', title: '', description: '', category: 'Workmanship', severity: 'MINOR', location: '', discipline: '' });
      load();
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Gagal menyimpan NCR');
    } finally { setSaving(false); }
  };

  const handleTransition = async (id: string, toStatus: string) => {
    try { await ncrApi.transition(id, toStatus); load(); setSelected(null); }
    catch (err: any) { alert(err.response?.data?.message ?? 'Gagal transisi'); }
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">NCR</h1>
          <p className="text-gray-500 mt-1">Non-Conformance Reports — Total: {ncrs.total}</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 transition"
        >
          + Buat NCR
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none">
          <option value="">Semua Status</option>
          {['OPEN','UNDER_REVIEW','AWAITING_CLOSURE','CLOSED','VOID'].map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select value={filterProject} onChange={(e) => setFilterProject(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none">
          <option value="">Semua Proyek</option>
          {projects.map((p: any) => <option key={p.id} value={p.id}>{p.code} — {p.name}</option>)}
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-gray-400 text-sm">Memuat...</div>
      ) : ncrs.items.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-4xl mb-2">✅</div>
          <div>Tidak ada NCR ditemukan</div>
        </div>
      ) : (
        <div className="space-y-3">
          {ncrs.items.map((ncr) => (
            <div
              key={ncr.id}
              onClick={() => setSelected(ncr)}
              className={`bg-white rounded-xl border-l-4 border p-4 cursor-pointer hover:shadow-sm transition ${
                SEVERITY_COLORS[ncr.severity] ?? 'border-gray-300'
              }`}
            >
              <div className="flex justify-between items-start gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-gray-400">{ncr.ncrNo}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[ncr.status]}`}>{ncr.status}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${SEVERITY_COLORS[ncr.severity]}`}>{ncr.severity}</span>
                  </div>
                  <div className="font-medium text-gray-800 mt-1">{ncr.title}</div>
                  <div className="text-sm text-gray-500 mt-0.5 truncate">{ncr.description}</div>
                </div>
                <div className="text-right shrink-0 text-xs text-gray-400">
                  <div>{ncr.project?.code}</div>
                  <div>{ncr.category}</div>
                  {ncr.dueDate && <div className="text-red-500">Due: {new Date(ncr.dueDate).toLocaleDateString('id-ID')}</div>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-xl p-6 space-y-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-xs font-mono text-gray-400">{selected.ncrNo}</div>
                <h2 className="text-lg font-bold text-gray-900 mt-0.5">{selected.title}</h2>
              </div>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <div className="flex gap-2">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[selected.status]}`}>{selected.status}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${SEVERITY_COLORS[selected.severity]}`}>{selected.severity}</span>
            </div>
            <p className="text-sm text-gray-700">{selected.description}</p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><span className="font-medium">Kategori:</span> {selected.category}</div>
              {selected.location && <div><span className="font-medium">Lokasi:</span> {selected.location}</div>}
              {selected.discipline && <div><span className="font-medium">Disiplin:</span> {selected.discipline}</div>}
              <div><span className="font-medium">Raised:</span> {new Date(selected.raisedAt).toLocaleDateString('id-ID')}</div>
            </div>
            {/* Transition buttons */}
            <div className="flex gap-2 flex-wrap pt-2 border-t">
              {selected.status === 'OPEN' && (
                <button onClick={() => handleTransition(selected.id, 'UNDER_REVIEW')} className="bg-yellow-500 text-white px-3 py-1.5 rounded-lg text-xs font-medium">→ Under Review</button>
              )}
              {selected.status === 'UNDER_REVIEW' && (
                <button onClick={() => handleTransition(selected.id, 'AWAITING_CLOSURE')} className="bg-blue-500 text-white px-3 py-1.5 rounded-lg text-xs font-medium">→ Awaiting Closure</button>
              )}
              {selected.status === 'AWAITING_CLOSURE' && (
                <button onClick={() => handleTransition(selected.id, 'CLOSED')} className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium">→ Closed</button>
              )}
              {['OPEN','UNDER_REVIEW'].includes(selected.status) && (
                <button onClick={() => handleTransition(selected.id, 'VOID')} className="bg-gray-400 text-white px-3 py-1.5 rounded-lg text-xs font-medium">Void</button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <form onSubmit={handleCreate} className="bg-white rounded-2xl w-full max-w-lg p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-gray-900">Buat NCR Baru</h2>
              <button type="button" onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            {error && <div className="text-red-600 text-sm bg-red-50 rounded-lg p-3">{error}</div>}
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-600">Proyek *</label>
                <select required value={form.projectId} onChange={(e) => setForm({ ...form, projectId: e.target.value })}
                  className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none">
                  <option value="">— Pilih proyek —</option>
                  {projects.map((p: any) => <option key={p.id} value={p.id}>{p.code} — {p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Judul *</label>
                <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Deskripsi *</label>
                <textarea required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3} className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-600">Kategori</label>
                  <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none">
                    {['Workmanship','Material','Design','Safety','Cleanliness','Documentation'].map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Severity</label>
                  <select value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value })}
                    className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none">
                    {['MINOR','MAJOR','CRITICAL'].map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Lokasi</label>
                <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })}
                  className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none" />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setShowCreate(false)}
                className="flex-1 border rounded-lg py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">Batal</button>
              <button type="submit" disabled={saving}
                className="flex-1 bg-brand-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-brand-700 disabled:opacity-50">
                {saving ? 'Menyimpan...' : 'Simpan NCR'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
