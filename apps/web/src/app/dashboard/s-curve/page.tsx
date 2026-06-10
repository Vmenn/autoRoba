'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface ProjectSummary {
  projectId: string;
  code: string;
  name: string;
  latestDate: string | null;
  plannedPct: number;
  actualPct: number;
  deviation: number;
}

interface Snapshot {
  date: string;
  plannedPct: number;
  actualPct: number;
  plannedValue: number;
  earnedValue: number;
  actualCost: number;
  spi: number | null;
  cpi: number | null;
}

interface SCurveData {
  project: { code: string; name: string; startDate: string; endDate: string; contractValue: number };
  snapshots: Snapshot[];
}

export default function SCurvePage() {
  const [summaries, setSummaries] = useState<ProjectSummary[]>([]);
  const [projects, setProjects] = useState<{ id: string; code: string; name: string }[]>([]);
  const [selected, setSelected] = useState('');
  const [curveData, setCurveData] = useState<SCurveData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showInputModal, setShowInputModal] = useState(false);
  const [snapForm, setSnapForm] = useState({ projectId: '', snapshotDate: '', plannedPct: '', actualPct: '', plannedValue: '', earnedValue: '', actualCost: '' });

  const load = async () => {
    try {
      setLoading(true);
      const [sumRes, projRes] = await Promise.all([
        api.get('/v1/s-curve/summary').then((r) => r.data),
        api.get('/v1/projects').then((r) => r.data),
      ]);
      setSummaries(Array.isArray(sumRes) ? sumRes : []);
      setProjects(projRes.items ?? []);
    } finally {
      setLoading(false);
    }
  };

  const loadCurve = async (projectId: string) => {
    const res = await api.get(`/v1/s-curve/projects/${projectId}`).then((r) => r.data);
    setCurveData(res);
    setSelected(projectId);
  };

  useEffect(() => { load(); }, []);

  const submitSnap = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post('/v1/s-curve/snapshots', {
      projectId: snapForm.projectId, snapshotDate: snapForm.snapshotDate,
      plannedPct: Number(snapForm.plannedPct), actualPct: Number(snapForm.actualPct),
      plannedValue: Number(snapForm.plannedValue), earnedValue: Number(snapForm.earnedValue),
      actualCost: Number(snapForm.actualCost),
    });
    setShowInputModal(false);
    setSnapForm({ projectId: '', snapshotDate: '', plannedPct: '', actualPct: '', plannedValue: '', earnedValue: '', actualCost: '' });
    load();
    if (snapForm.projectId === selected) loadCurve(selected);
  };

  const latestSnap = curveData?.snapshots.at(-1);
  const maxPct = curveData ? Math.max(...curveData.snapshots.flatMap((s) => [s.plannedPct, s.actualPct]), 100) : 100;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">S-Curve & Progress Monitoring</h1>
          <p className="text-sm text-gray-500 mt-1">Planned vs Actual progress per proyek aktif</p>
        </div>
        <button onClick={() => setShowInputModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
          + Input Snapshot
        </button>
      </div>

      {/* Project summary grid */}
      {loading ? (
        <div className="text-center py-16 text-gray-400">Memuat...</div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3 mb-6">
            {summaries.map((s) => (
              <button key={s.projectId} onClick={() => loadCurve(s.projectId)}
                className={`text-left bg-white rounded-xl border px-4 py-3 hover:shadow transition ${selected === s.projectId ? 'border-blue-500 ring-1 ring-blue-400' : 'border-gray-200'}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs text-blue-700 font-semibold">{s.code}</span>
                  <span className={`text-xs font-semibold ${s.deviation >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {s.deviation >= 0 ? '+' : ''}{s.deviation.toFixed(1)}%
                  </span>
                </div>
                <div className="text-sm font-medium text-gray-800 truncate mb-2">{s.name}</div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Planned</span><span>{s.plannedPct.toFixed(1)}%</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-300 rounded-full" style={{ width: `${Math.min(s.plannedPct, 100)}%` }} />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Actual</span><span>{s.actualPct.toFixed(1)}%</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${s.deviation >= 0 ? 'bg-green-500' : 'bg-red-500'}`} style={{ width: `${Math.min(s.actualPct, 100)}%` }} />
                  </div>
                </div>
                {s.latestDate && <div className="text-xs text-gray-400 mt-2">Update: {new Date(s.latestDate).toLocaleDateString('id-ID')}</div>}
              </button>
            ))}
            {summaries.length === 0 && (
              <div className="col-span-3 text-center py-12 text-gray-400">Belum ada data snapshot. Klik &quot;Input Snapshot&quot; untuk mulai.</div>
            )}
          </div>

          {/* S-Curve chart */}
          {curveData && curveData.snapshots.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-900">{curveData.project.code} — S-Curve</h2>
                {latestSnap && (
                  <div className="flex gap-4 text-xs">
                    <span>SPI: <span className={`font-bold ${(latestSnap.spi ?? 1) >= 1 ? 'text-green-600' : 'text-red-600'}`}>{latestSnap.spi?.toFixed(2) ?? '—'}</span></span>
                    <span>CPI: <span className={`font-bold ${(latestSnap.cpi ?? 1) >= 1 ? 'text-green-600' : 'text-red-600'}`}>{latestSnap.cpi?.toFixed(2) ?? '—'}</span></span>
                  </div>
                )}
              </div>
              {/* Simple SVG S-Curve */}
              <div className="relative">
                <svg viewBox={`0 0 ${curveData.snapshots.length * 60 + 40} 200`} className="w-full h-48" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="planned-grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                    </linearGradient>
                    <linearGradient id="actual-grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity="0.2" />
                      <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  {/* Grid lines */}
                  {[0, 25, 50, 75, 100].map((pct) => (
                    <line key={pct} x1="40" y1={180 - (pct / maxPct) * 160} x2={curveData.snapshots.length * 60 + 40} y2={180 - (pct / maxPct) * 160}
                      stroke="#f3f4f6" strokeWidth="1" />
                  ))}
                  {/* Planned line */}
                  <polyline
                    points={curveData.snapshots.map((s, i) => `${i * 60 + 40},${180 - (s.plannedPct / maxPct) * 160}`).join(' ')}
                    fill="none" stroke="#3b82f6" strokeWidth="2" strokeDasharray="4 2" />
                  {/* Actual line */}
                  <polyline
                    points={curveData.snapshots.map((s, i) => `${i * 60 + 40},${180 - (s.actualPct / maxPct) * 160}`).join(' ')}
                    fill="none" stroke="#10b981" strokeWidth="2.5" />
                  {/* Data points */}
                  {curveData.snapshots.map((s, i) => (
                    <g key={i}>
                      <circle cx={i * 60 + 40} cy={180 - (s.plannedPct / maxPct) * 160} r="3" fill="#3b82f6" />
                      <circle cx={i * 60 + 40} cy={180 - (s.actualPct / maxPct) * 160} r="3" fill="#10b981" />
                    </g>
                  ))}
                </svg>
              </div>
              {/* Table */}
              <div className="overflow-x-auto mt-2">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="py-1 text-left text-gray-500 font-medium">Tanggal</th>
                      <th className="py-1 text-right text-blue-600 font-medium">Plan%</th>
                      <th className="py-1 text-right text-green-600 font-medium">Actual%</th>
                      <th className="py-1 text-right text-gray-500 font-medium">Dev</th>
                      <th className="py-1 text-right text-gray-500 font-medium">SPI</th>
                      <th className="py-1 text-right text-gray-500 font-medium">CPI</th>
                    </tr>
                  </thead>
                  <tbody>
                    {curveData.snapshots.map((s, i) => (
                      <tr key={i} className="border-b border-gray-50">
                        <td className="py-1 text-gray-600">{new Date(s.date).toLocaleDateString('id-ID', { month: 'short', year: '2-digit' })}</td>
                        <td className="py-1 text-right text-blue-600">{s.plannedPct.toFixed(1)}%</td>
                        <td className="py-1 text-right text-green-600">{s.actualPct.toFixed(1)}%</td>
                        <td className={`py-1 text-right font-medium ${s.actualPct - s.plannedPct >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {(s.actualPct - s.plannedPct) >= 0 ? '+' : ''}{(s.actualPct - s.plannedPct).toFixed(1)}%
                        </td>
                        <td className={`py-1 text-right ${(s.spi ?? 1) >= 1 ? 'text-green-600' : 'text-red-600'}`}>{s.spi?.toFixed(2) ?? '—'}</td>
                        <td className={`py-1 text-right ${(s.cpi ?? 1) >= 1 ? 'text-green-600' : 'text-red-600'}`}>{s.cpi?.toFixed(2) ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex gap-4 mt-3 text-xs text-gray-500">
                <span className="flex items-center gap-1"><span className="w-6 border-t-2 border-blue-400 border-dashed" /> Planned</span>
                <span className="flex items-center gap-1"><span className="w-6 border-t-2 border-green-500" /> Actual</span>
              </div>
            </div>
          )}
        </>
      )}

      {showInputModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold mb-4">Input Progress Snapshot</h2>
            <form onSubmit={submitSnap} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Proyek *</label>
                  <select required value={snapForm.projectId} onChange={(e) => setSnapForm({ ...snapForm, projectId: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                    <option value="">Pilih...</option>
                    {projects.map((p) => <option key={p.id} value={p.id}>{p.code}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Tanggal *</label>
                  <input required type="date" value={snapForm.snapshotDate} onChange={(e) => setSnapForm({ ...snapForm, snapshotDate: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Planned % *</label>
                  <input required type="number" step="0.01" min="0" max="100" value={snapForm.plannedPct}
                    onChange={(e) => setSnapForm({ ...snapForm, plannedPct: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Actual % *</label>
                  <input required type="number" step="0.01" min="0" max="100" value={snapForm.actualPct}
                    onChange={(e) => setSnapForm({ ...snapForm, actualPct: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">PV (Planned Value)</label>
                  <input type="number" value={snapForm.plannedValue} onChange={(e) => setSnapForm({ ...snapForm, plannedValue: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">EV (Earned Value)</label>
                  <input type="number" value={snapForm.earnedValue} onChange={(e) => setSnapForm({ ...snapForm, earnedValue: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">AC (Actual Cost)</label>
                  <input type="number" value={snapForm.actualCost} onChange={(e) => setSnapForm({ ...snapForm, actualCost: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowInputModal(false)}
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
