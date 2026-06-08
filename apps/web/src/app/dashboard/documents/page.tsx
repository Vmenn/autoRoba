'use client';

import { useState, useEffect } from 'react';
import { documentApi, projectApi } from '@/lib/api';

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-600',
  IFA: 'bg-yellow-100 text-yellow-700',
  IFR: 'bg-blue-100 text-blue-700',
  IFC: 'bg-green-100 text-green-700',
  IFI: 'bg-teal-100 text-teal-700',
  APPROVED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
  SUPERSEDED: 'bg-gray-100 text-gray-500',
  VOID: 'bg-gray-100 text-gray-400',
};

const DISCIPLINE_ICONS: Record<string, string> = {
  CIVIL: '🏗', STRUCTURAL: '⚙️', MECHANICAL: '🔧', ELECTRICAL: '⚡',
  INSTRUMENTATION: '📡', PIPING: '🔩', HVAC: '💨', SAFETY: '⛑️', GENERAL: '📄',
};

export default function DocumentsPage() {
  const [docs, setDocs] = useState<{ items: any[]; total: number }>({ items: [], total: 0 });
  const [projects, setProjects] = useState<any[]>([]);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterProject, setFilterProject] = useState('');
  const [filterDiscipline, setFilterDiscipline] = useState('');
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [form, setForm] = useState({ projectId: '', title: '', discipline: 'GENERAL', category: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    documentApi.list({
      status: filterStatus || undefined,
      projectId: filterProject || undefined,
      discipline: filterDiscipline || undefined,
    }).then(setDocs).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [filterStatus, filterProject, filterDiscipline]);
  useEffect(() => { projectApi.list().then(setProjects).catch(console.error); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      await documentApi.create(form);
      setShowCreate(false);
      setForm({ projectId: '', title: '', discipline: 'GENERAL', category: '' });
      load();
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Gagal menyimpan');
    } finally { setSaving(false); }
  };

  const openDetail = async (doc: any) => {
    try { setSelected(await documentApi.get(doc.id)); }
    catch (e) { console.error(e); }
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dokumen</h1>
          <p className="text-gray-500 mt-1">Document Management — Total: {docs.total}</p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 transition">
          + Register Dokumen
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none">
          <option value="">Semua Status</option>
          {Object.keys(STATUS_COLORS).map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filterDiscipline} onChange={(e) => setFilterDiscipline(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none">
          <option value="">Semua Disiplin</option>
          {Object.keys(DISCIPLINE_ICONS).map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <select value={filterProject} onChange={(e) => setFilterProject(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none">
          <option value="">Semua Proyek</option>
          {projects.map((p: any) => <option key={p.id} value={p.id}>{p.code} — {p.name}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="text-gray-400 text-sm">Memuat...</div>
      ) : docs.items.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-4xl mb-2">📁</div>
          <div>Belum ada dokumen terdaftar</div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">No. Dokumen</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">Judul</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">Disiplin</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">Rev</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">Proyek</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {docs.items.map((doc) => (
                <tr key={doc.id} onClick={() => openDetail(doc)} className="hover:bg-gray-50 cursor-pointer">
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{doc.docNo}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-800 truncate max-w-xs">{doc.title}</div>
                    {doc.category && <div className="text-xs text-gray-400">{doc.category}</div>}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {DISCIPLINE_ICONS[doc.discipline]} {doc.discipline}
                  </td>
                  <td className="px-4 py-3 font-mono font-bold text-brand-700">{doc.currentRev}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[doc.status]}`}>{doc.status}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">{doc.project?.code}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-xl p-6 space-y-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-xs font-mono text-gray-400">{selected.docNo}</div>
                <h2 className="text-lg font-bold text-gray-900 mt-0.5">{selected.title}</h2>
              </div>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <div className="flex gap-2">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[selected.status]}`}>{selected.status}</span>
              <span className="text-xs bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full font-medium">Rev {selected.currentRev}</span>
            </div>
            {selected.versions?.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-700 mb-2 text-sm">Riwayat Revisi</h3>
                <div className="space-y-2">
                  {selected.versions.map((v: any) => (
                    <div key={v.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                      <div>
                        <span className="font-mono font-bold text-sm">Rev {v.revision}</span>
                        {v.changeNote && <span className="text-xs text-gray-500 ml-2">{v.changeNote}</span>}
                        {v.fileName && <div className="text-xs text-gray-400">{v.fileName}</div>}
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[v.status]}`}>{v.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <form onSubmit={handleCreate} className="bg-white rounded-2xl w-full max-w-lg p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-gray-900">Register Dokumen Baru</h2>
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
                <label className="text-sm font-medium text-gray-600">Judul Dokumen *</label>
                <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-600">Disiplin</label>
                  <select value={form.discipline} onChange={(e) => setForm({ ...form, discipline: e.target.value })}
                    className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none">
                    {Object.keys(DISCIPLINE_ICONS).map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Kategori</label>
                  <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                    placeholder="cth: Drawing, Spec, Calc"
                    className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none" />
                </div>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setShowCreate(false)}
                className="flex-1 border rounded-lg py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">Batal</button>
              <button type="submit" disabled={saving}
                className="flex-1 bg-brand-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-brand-700 disabled:opacity-50">
                {saving ? 'Menyimpan...' : 'Register Dokumen'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
