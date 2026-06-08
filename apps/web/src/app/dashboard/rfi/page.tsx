'use client';

import { useState, useEffect } from 'react';
import { rfiApi, projectApi } from '@/lib/api';

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-600',
  ISSUED: 'bg-blue-100 text-blue-700',
  RESPONDED: 'bg-green-100 text-green-700',
  CLARIFICATION_NEEDED: 'bg-yellow-100 text-yellow-700',
  CLOSED: 'bg-teal-100 text-teal-700',
  VOID: 'bg-gray-100 text-gray-400',
};

const PRIORITY_COLORS: Record<string, string> = {
  LOW: 'text-gray-400',
  NORMAL: 'text-blue-500',
  HIGH: 'text-orange-500',
  URGENT: 'text-red-600',
};

type RFI = {
  id: string; rfiNo: string; subject: string; question: string;
  discipline?: string; status: string; priority: string;
  requiredResponseDate?: string; issuedAt?: string;
  respondedAt?: string; response?: string;
  costImpact?: number; timeImpactDays?: number;
  project?: { code: string; name: string };
};

export default function RFIPage() {
  const [rfis, setRfis] = useState<{ items: RFI[]; total: number }>({ items: [], total: 0 });
  const [projects, setProjects] = useState<any[]>([]);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterProject, setFilterProject] = useState('');
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [selected, setSelected] = useState<RFI | null>(null);
  const [form, setForm] = useState({ projectId: '', subject: '', question: '', discipline: '', priority: 'NORMAL', requiredResponseDate: '' });
  const [responseText, setResponseText] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    rfiApi.list({ status: filterStatus || undefined, projectId: filterProject || undefined })
      .then(setRfis).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [filterStatus, filterProject]);
  useEffect(() => { projectApi.list().then(setProjects).catch(console.error); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      await rfiApi.create(form);
      setShowCreate(false);
      setForm({ projectId: '', subject: '', question: '', discipline: '', priority: 'NORMAL', requiredResponseDate: '' });
      load();
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Gagal menyimpan');
    } finally { setSaving(false); }
  };

  const handleIssue = async (id: string) => {
    try { await rfiApi.issue(id); load(); setSelected(null); }
    catch (err: any) { alert(err.response?.data?.message ?? 'Gagal issue'); }
  };

  const handleRespond = async (id: string) => {
    if (!responseText.trim()) return alert('Isi respons terlebih dahulu');
    try { await rfiApi.respond(id, { response: responseText }); load(); setSelected(null); setResponseText(''); }
    catch (err: any) { alert(err.response?.data?.message ?? 'Gagal merespons'); }
  };

  const handleClose = async (id: string) => {
    try { await rfiApi.close(id); load(); setSelected(null); }
    catch (err: any) { alert(err.response?.data?.message ?? 'Gagal menutup'); }
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">RFI</h1>
          <p className="text-gray-500 mt-1">Request for Information — Total: {rfis.total}</p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 transition">
          + Buat RFI
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none">
          <option value="">Semua Status</option>
          {['DRAFT','ISSUED','RESPONDED','CLARIFICATION_NEEDED','CLOSED'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filterProject} onChange={(e) => setFilterProject(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none">
          <option value="">Semua Proyek</option>
          {projects.map((p: any) => <option key={p.id} value={p.id}>{p.code} — {p.name}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="text-gray-400 text-sm">Memuat...</div>
      ) : rfis.items.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-4xl mb-2">❓</div>
          <div>Belum ada RFI</div>
        </div>
      ) : (
        <div className="space-y-3">
          {rfis.items.map((rfi) => (
            <div key={rfi.id} onClick={() => setSelected(rfi)}
              className="bg-white rounded-xl border p-4 cursor-pointer hover:shadow-sm transition">
              <div className="flex justify-between items-start gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-gray-400">{rfi.rfiNo}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[rfi.status]}`}>{rfi.status}</span>
                    <span className={`text-xs font-semibold ${PRIORITY_COLORS[rfi.priority]}`}>{rfi.priority}</span>
                  </div>
                  <div className="font-medium text-gray-800 mt-1">{rfi.subject}</div>
                  <div className="text-sm text-gray-500 mt-0.5 line-clamp-2">{rfi.question}</div>
                </div>
                <div className="text-right shrink-0 text-xs text-gray-400">
                  <div>{rfi.project?.code}</div>
                  {rfi.discipline && <div>{rfi.discipline}</div>}
                  {rfi.requiredResponseDate && (
                    <div className={new Date(rfi.requiredResponseDate) < new Date() && rfi.status === 'ISSUED' ? 'text-red-500' : ''}>
                      Due: {new Date(rfi.requiredResponseDate).toLocaleDateString('id-ID')}
                    </div>
                  )}
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
                <div className="text-xs font-mono text-gray-400">{selected.rfiNo}</div>
                <h2 className="text-lg font-bold text-gray-900 mt-0.5">{selected.subject}</h2>
              </div>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[selected.status]}`}>{selected.status}</span>
            <div>
              <div className="text-xs font-medium text-gray-500 mb-1">Pertanyaan</div>
              <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">{selected.question}</p>
            </div>
            {selected.response && (
              <div>
                <div className="text-xs font-medium text-gray-500 mb-1">Respons</div>
                <p className="text-sm text-gray-700 bg-green-50 rounded-lg p-3">{selected.response}</p>
                {selected.costImpact && <div className="text-xs text-orange-600 mt-1">Dampak Biaya: Rp {selected.costImpact.toLocaleString('id-ID')}</div>}
                {selected.timeImpactDays && <div className="text-xs text-orange-600">Dampak Waktu: {selected.timeImpactDays} hari</div>}
              </div>
            )}
            {selected.status === 'ISSUED' && (
              <div className="space-y-2 pt-2 border-t">
                <div className="text-xs font-medium text-gray-600">Tulis Respons</div>
                <textarea value={responseText} onChange={(e) => setResponseText(e.target.value)}
                  rows={3} placeholder="Jawaban / klarifikasi..."
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none" />
                <button onClick={() => handleRespond(selected.id)} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium">
                  Kirim Respons
                </button>
              </div>
            )}
            <div className="flex gap-2 flex-wrap pt-2 border-t">
              {selected.status === 'DRAFT' && (
                <button onClick={() => handleIssue(selected.id)} className="bg-blue-500 text-white px-3 py-1.5 rounded-lg text-xs font-medium">→ Issue</button>
              )}
              {['RESPONDED','ISSUED'].includes(selected.status) && (
                <button onClick={() => handleClose(selected.id)} className="bg-teal-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium">→ Close</button>
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
              <h2 className="text-lg font-bold text-gray-900">Buat RFI Baru</h2>
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
                <label className="text-sm font-medium text-gray-600">Subjek *</label>
                <input required value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Pertanyaan *</label>
                <textarea required value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })}
                  rows={3} className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-600">Disiplin</label>
                  <select value={form.discipline} onChange={(e) => setForm({ ...form, discipline: e.target.value })}
                    className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none">
                    <option value="">—</option>
                    {['Civil','Structural','Mechanical','Electrical','Instrumentation','Piping','HVAC'].map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Prioritas</label>
                  <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}
                    className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none">
                    {['LOW','NORMAL','HIGH','URGENT'].map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Tanggal Respons Diperlukan</label>
                <input type="date" value={form.requiredResponseDate} onChange={(e) => setForm({ ...form, requiredResponseDate: e.target.value })}
                  className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none" />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setShowCreate(false)}
                className="flex-1 border rounded-lg py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">Batal</button>
              <button type="submit" disabled={saving}
                className="flex-1 bg-brand-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-brand-700 disabled:opacity-50">
                {saving ? 'Menyimpan...' : 'Simpan RFI'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
