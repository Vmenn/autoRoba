'use client';

import { useState, useEffect } from 'react';
import { dailyLogApi, projectApi } from '@/lib/api';

const WEATHER_ICONS: Record<string, string> = {
  Cerah: '☀️', 'Cerah Berawan': '⛅', Mendung: '☁️', Hujan: '🌧️', 'Hujan Lebat': '⛈️',
};

export default function DailyLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [filterProject, setFilterProject] = useState('');
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo] = useState('');
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [form, setForm] = useState({
    projectId: '', logDate: new Date().toISOString().slice(0, 10),
    weather: 'Cerah', manpowerCount: 0, workSummary: '', issues: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    dailyLogApi.list({ projectId: filterProject || undefined, from: filterFrom || undefined, to: filterTo || undefined })
      .then(setLogs).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [filterProject, filterFrom, filterTo]);
  useEffect(() => { projectApi.list().then(setProjects).catch(console.error); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      await dailyLogApi.create(form);
      setShowCreate(false);
      setForm({ projectId: '', logDate: new Date().toISOString().slice(0, 10), weather: 'Cerah', manpowerCount: 0, workSummary: '', issues: '' });
      load();
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Gagal menyimpan');
    } finally { setSaving(false); }
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Daily Log</h1>
          <p className="text-gray-500 mt-1">Field Diary — Buku Harian Lapangan</p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 transition">
          + Buat Log
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <select value={filterProject} onChange={(e) => setFilterProject(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none">
          <option value="">Semua Proyek</option>
          {projects.map((p: any) => <option key={p.id} value={p.id}>{p.code} — {p.name}</option>)}
        </select>
        <input type="date" value={filterFrom} onChange={(e) => setFilterFrom(e.target.value)}
          placeholder="Dari tanggal"
          className="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none" />
        <input type="date" value={filterTo} onChange={(e) => setFilterTo(e.target.value)}
          placeholder="Sampai tanggal"
          className="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none" />
      </div>

      {loading ? (
        <div className="text-gray-400 text-sm">Memuat...</div>
      ) : logs.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-4xl mb-2">📅</div>
          <div>Belum ada log harian</div>
        </div>
      ) : (
        <div className="space-y-3">
          {logs.map((log) => (
            <div key={log.id} onClick={() => setSelected(log)}
              className="bg-white rounded-xl border p-4 cursor-pointer hover:shadow-sm transition">
              <div className="flex justify-between items-start gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-800">
                      {new Date(log.logDate).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </span>
                    {log.weather && <span className="text-lg">{WEATHER_ICONS[log.weather] ?? '🌤️'}</span>}
                    <span className="text-sm text-gray-500">{log.weather}</span>
                  </div>
                  <div className="text-sm text-gray-500 mt-0.5">{log.project?.code} — {log.project?.name}</div>
                  {log.workSummary && <p className="text-sm text-gray-700 mt-1 line-clamp-2">{log.workSummary}</p>}
                </div>
                <div className="text-right shrink-0">
                  <div className="text-2xl font-bold text-brand-700">{log.manpowerCount}</div>
                  <div className="text-xs text-gray-400">Tenaga Kerja</div>
                </div>
              </div>
              {log.issues && (
                <div className="mt-2 bg-orange-50 border border-orange-200 rounded-lg p-2 text-xs text-orange-700">
                  ⚠️ {log.issues}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-xl p-6 space-y-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-start">
              <h2 className="text-lg font-bold text-gray-900">
                {new Date(selected.logDate).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </h2>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="font-medium">Cuaca:</span> {WEATHER_ICONS[selected.weather]} {selected.weather}</div>
              <div><span className="font-medium">Tenaga Kerja:</span> {selected.manpowerCount} orang</div>
              <div><span className="font-medium">Proyek:</span> {selected.project?.code}</div>
            </div>
            {selected.workSummary && (
              <div>
                <div className="text-xs font-medium text-gray-500 mb-1">Ringkasan Pekerjaan</div>
                <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">{selected.workSummary}</p>
              </div>
            )}
            {selected.issues && (
              <div>
                <div className="text-xs font-medium text-gray-500 mb-1">Kendala / Isu</div>
                <p className="text-sm text-orange-700 bg-orange-50 rounded-lg p-3">{selected.issues}</p>
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
              <h2 className="text-lg font-bold text-gray-900">Buat Log Harian</h2>
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
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-600">Tanggal *</label>
                  <input required type="date" value={form.logDate} onChange={(e) => setForm({ ...form, logDate: e.target.value })}
                    className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Cuaca</label>
                  <select value={form.weather} onChange={(e) => setForm({ ...form, weather: e.target.value })}
                    className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none">
                    {Object.keys(WEATHER_ICONS).map(w => <option key={w}>{w}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Jumlah Tenaga Kerja</label>
                <input type="number" min={0} value={form.manpowerCount} onChange={(e) => setForm({ ...form, manpowerCount: parseInt(e.target.value) || 0 })}
                  className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Ringkasan Pekerjaan</label>
                <textarea value={form.workSummary} onChange={(e) => setForm({ ...form, workSummary: e.target.value })}
                  rows={3} className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Kendala / Isu</label>
                <textarea value={form.issues} onChange={(e) => setForm({ ...form, issues: e.target.value })}
                  rows={2} className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none" />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setShowCreate(false)}
                className="flex-1 border rounded-lg py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">Batal</button>
              <button type="submit" disabled={saving}
                className="flex-1 bg-brand-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-brand-700 disabled:opacity-50">
                {saving ? 'Menyimpan...' : 'Simpan Log'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
