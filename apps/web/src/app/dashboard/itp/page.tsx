'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface ITPRecord {
  id: string;
  recordNo: string;
  title: string;
  status: string;
  createdAt: string;
  project?: { code: string; name: string };
  template?: { code: string; name: string };
  _count?: { checkItems: number };
}

interface ITPTemplate {
  id: string;
  code: string;
  name: string;
  discipline: string;
  _count?: { items: number };
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  IN_PROGRESS: 'bg-blue-100 text-blue-800',
  PASSED: 'bg-green-100 text-green-800',
  FAILED: 'bg-red-100 text-red-700',
  PARTIAL: 'bg-orange-100 text-orange-800',
  VOID: 'bg-gray-200 text-gray-500',
};

export default function ITPPage() {
  const [records, setRecords] = useState<ITPRecord[]>([]);
  const [templates, setTemplates] = useState<ITPTemplate[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'records' | 'templates'>('records');
  const [projects, setProjects] = useState<{ id: string; code: string; name: string }[]>([]);
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [recordForm, setRecordForm] = useState({ projectId: '', title: '', templateId: '' });
  const [templateForm, setTemplateForm] = useState({ code: '', name: '', discipline: '' });

  const load = async () => {
    try {
      setLoading(true);
      const [recRes, tplRes, projRes] = await Promise.all([
        api.get('/v1/itp/records').then((r) => r.data),
        api.get('/v1/itp/templates').then((r) => r.data),
        api.get('/v1/projects').then((r) => r.data),
      ]);
      setRecords(recRes.items ?? []);
      setTotal(recRes.total ?? 0);
      setTemplates(Array.isArray(tplRes) ? tplRes : []);
      setProjects(projRes.items ?? []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const submitRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post('/v1/itp/records', {
      projectId: recordForm.projectId, title: recordForm.title,
      templateId: recordForm.templateId || undefined,
    });
    setShowRecordModal(false);
    setRecordForm({ projectId: '', title: '', templateId: '' });
    load();
  };

  const submitTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post('/v1/itp/templates', templateForm);
    setShowTemplateModal(false);
    setTemplateForm({ code: '', name: '', discipline: '' });
    load();
  };

  const closeRecord = async (id: string, status: 'PASSED' | 'FAILED') => {
    await api.patch(`/v1/itp/records/${id}/close`, { status });
    load();
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">QA/QC — Inspection & Test Plans</h1>
          <p className="text-sm text-gray-500 mt-1">{total} rekaman inspeksi • {templates.length} template ITP</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowTemplateModal(true)}
            className="border border-blue-600 text-blue-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-50">
            + Template ITP
          </button>
          <button onClick={() => setShowRecordModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
            + Rekaman Inspeksi
          </button>
        </div>
      </div>

      <div className="flex gap-1 mb-4 bg-gray-100 rounded-lg p-1 w-fit">
        {(['records', 'templates'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${tab === t ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
            {t === 'records' ? 'Rekaman Inspeksi' : 'Template ITP'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400">Memuat...</div>
      ) : tab === 'records' ? (
        records.length === 0 ? (
          <div className="text-center py-16 text-gray-400">Belum ada rekaman inspeksi</div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">No. Rekaman</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Judul</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Template</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Proyek</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Status</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {records.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{r.recordNo}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{r.title}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{r.template?.code ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-500">{r.project?.code ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[r.status] ?? 'bg-gray-100'}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {r.status === 'PENDING' || r.status === 'IN_PROGRESS' ? (
                        <>
                          <button onClick={() => closeRecord(r.id, 'PASSED')} className="text-xs text-green-600 hover:text-green-800 mr-2">✓ Pass</button>
                          <button onClick={() => closeRecord(r.id, 'FAILED')} className="text-xs text-red-600 hover:text-red-800">✗ Fail</button>
                        </>
                      ) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : (
        templates.length === 0 ? (
          <div className="text-center py-16 text-gray-400">Belum ada template ITP</div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {templates.map((t) => (
              <div key={t.id} className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-sm transition">
                <div className="flex items-start justify-between mb-2">
                  <span className="font-mono text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded">{t.code}</span>
                  <span className="text-xs text-gray-400">{t._count?.items ?? 0} item</span>
                </div>
                <div className="font-semibold text-gray-900 text-sm">{t.name}</div>
                <div className="text-xs text-gray-500 mt-1">{t.discipline}</div>
              </div>
            ))}
          </div>
        )
      )}

      {showRecordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold mb-4">Buat Rekaman Inspeksi</h2>
            <form onSubmit={submitRecord} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Proyek *</label>
                <select required value={recordForm.projectId} onChange={(e) => setRecordForm({ ...recordForm, projectId: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                  <option value="">Pilih proyek...</option>
                  {projects.map((p) => <option key={p.id} value={p.id}>{p.code} — {p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Judul *</label>
                <input required value={recordForm.title} onChange={(e) => setRecordForm({ ...recordForm, title: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Template ITP</label>
                <select value={recordForm.templateId} onChange={(e) => setRecordForm({ ...recordForm, templateId: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                  <option value="">Tanpa template</option>
                  {templates.map((t) => <option key={t.id} value={t.id}>{t.code} — {t.name}</option>)}
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowRecordModal(false)}
                  className="px-4 py-2 text-sm rounded-lg border border-gray-300 hover:bg-gray-50">Batal</button>
                <button type="submit"
                  className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700">Buat</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showTemplateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold mb-4">Buat Template ITP</h2>
            <form onSubmit={submitTemplate} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Kode *</label>
                <input required value={templateForm.code} onChange={(e) => setTemplateForm({ ...templateForm, code: e.target.value })}
                  placeholder="e.g. ITP-CIVIL-001" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Nama *</label>
                <input required value={templateForm.name} onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                  placeholder="e.g. Inspeksi Pondasi Bored Pile" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Disiplin *</label>
                <input required value={templateForm.discipline} onChange={(e) => setTemplateForm({ ...templateForm, discipline: e.target.value })}
                  placeholder="e.g. CIVIL, STRUCTURAL, PIPING" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowTemplateModal(false)}
                  className="px-4 py-2 text-sm rounded-lg border border-gray-300 hover:bg-gray-50">Batal</button>
                <button type="submit"
                  className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
