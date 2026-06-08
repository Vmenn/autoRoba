'use client';

import { useState, useEffect } from 'react';
import { rabRapApi, projectApi } from '@/lib/api';

function fmt(n: any) {
  return new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(Number(n));
}

export default function RABRAPPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [versions, setVersions] = useState<any[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<any>(null);
  const [versionDetail, setVersionDetail] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [showCreateVersion, setShowCreateVersion] = useState(false);
  const [versionForm, setVersionForm] = useState({ name: '', description: '', isBaseline: false });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { projectApi.list().then(setProjects).catch(console.error); }, []);

  useEffect(() => {
    if (!selectedProjectId) { setVersions([]); return; }
    setLoading(true);
    rabRapApi.listVersions(selectedProjectId)
      .then(setVersions).catch(console.error).finally(() => setLoading(false));
  }, [selectedProjectId]);

  const openVersion = async (version: any) => {
    setSelectedVersion(version);
    try {
      const detail = await rabRapApi.getVersion(version.id);
      setVersionDetail(detail);
    } catch { setVersionDetail(null); }
  };

  const handleCreateVersion = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      await rabRapApi.createVersion({ projectId: selectedProjectId, ...versionForm });
      setShowCreateVersion(false);
      setVersionForm({ name: '', description: '', isBaseline: false });
      if (selectedProjectId) {
        rabRapApi.listVersions(selectedProjectId).then(setVersions).catch(console.error);
      }
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Gagal menyimpan');
    } finally { setSaving(false); }
  };

  const marginColor = (pct: number) => {
    if (pct >= 15) return 'text-green-600';
    if (pct >= 10) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">RAB / RAP</h1>
          <p className="text-gray-500 mt-1">Rencana Anggaran Biaya / Rencana Anggaran Pelaksanaan — §6</p>
        </div>
      </div>

      {/* Project Selector */}
      <div className="bg-white rounded-xl border p-5 flex gap-4 items-end">
        <div className="flex-1 max-w-md">
          <label className="text-sm font-medium text-gray-600 block mb-1">Pilih Proyek</label>
          <select value={selectedProjectId} onChange={(e) => setSelectedProjectId(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none">
            <option value="">— Pilih proyek —</option>
            {projects.map((p: any) => <option key={p.id} value={p.id}>{p.code} — {p.name}</option>)}
          </select>
        </div>
        {selectedProjectId && (
          <button onClick={() => setShowCreateVersion(true)}
            className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 transition">
            + Versi Anggaran
          </button>
        )}
      </div>

      {/* Versions List */}
      {loading && <div className="text-gray-400 text-sm">Memuat versi anggaran...</div>}
      {!loading && versions.length === 0 && selectedProjectId && (
        <div className="text-center py-12 text-gray-400">
          <div className="text-4xl mb-2">📋</div>
          <div>Belum ada versi anggaran untuk proyek ini</div>
        </div>
      )}
      {!loading && versions.length > 0 && (
        <div className="space-y-3">
          {versions.map((v) => (
            <div key={v.id} onClick={() => openVersion(v)}
              className="bg-white rounded-xl border p-5 cursor-pointer hover:shadow-sm transition">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-900">v{v.version} — {v.name}</span>
                    {v.isBaseline && <span className="text-xs bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full font-medium">BASELINE</span>}
                    {v.isLocked && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">🔒 Terkunci</span>}
                  </div>
                  {v.description && <div className="text-sm text-gray-500 mt-0.5">{v.description}</div>}
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-400">RAB</div>
                  <div className="font-bold text-gray-900">Rp {fmt(v.totalRAB)}</div>
                  <div className="text-xs text-gray-400 mt-0.5">RAP: Rp {fmt(v.totalRAP)}</div>
                </div>
              </div>
              <div className="mt-3 flex gap-4 text-sm">
                <div>
                  <span className="text-gray-400">Margin: </span>
                  <span className={`font-semibold ${marginColor(parseFloat(v.marginPct))}`}>
                    Rp {fmt(v.margin)} ({parseFloat(v.marginPct).toFixed(1)}%)
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Version Detail Modal */}
      {selectedVersion && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xl font-bold text-gray-900">v{selectedVersion.version} — {selectedVersion.name}</h2>
                {selectedVersion.description && <p className="text-sm text-gray-500 mt-0.5">{selectedVersion.description}</p>}
              </div>
              <button onClick={() => { setSelectedVersion(null); setVersionDetail(null); }} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-brand-50 rounded-xl p-4">
                <div className="text-xs text-brand-600 font-medium">Total RAB (Jual)</div>
                <div className="text-xl font-bold text-brand-800 mt-0.5">Rp {fmt(selectedVersion.totalRAB)}</div>
                <div className="text-xs text-brand-500">Harga ke Owner</div>
              </div>
              <div className="bg-orange-50 rounded-xl p-4">
                <div className="text-xs text-orange-600 font-medium">Total RAP (Biaya)</div>
                <div className="text-xl font-bold text-orange-800 mt-0.5">Rp {fmt(selectedVersion.totalRAP)}</div>
                <div className="text-xs text-orange-500">Biaya Internal</div>
              </div>
              <div className={`rounded-xl p-4 ${parseFloat(selectedVersion.marginPct) >= 10 ? 'bg-green-50' : 'bg-red-50'}`}>
                <div className={`text-xs font-medium ${parseFloat(selectedVersion.marginPct) >= 10 ? 'text-green-600' : 'text-red-600'}`}>Margin</div>
                <div className={`text-xl font-bold mt-0.5 ${parseFloat(selectedVersion.marginPct) >= 10 ? 'text-green-800' : 'text-red-800'}`}>
                  {parseFloat(selectedVersion.marginPct).toFixed(1)}%
                </div>
                <div className={`text-xs ${parseFloat(selectedVersion.marginPct) >= 10 ? 'text-green-500' : 'text-red-500'}`}>
                  Rp {fmt(selectedVersion.margin)}
                </div>
              </div>
            </div>

            {/* RAB Lines */}
            {versionDetail?.rabLines?.length > 0 ? (
              <div>
                <h3 className="font-semibold text-gray-700 mb-3">Rincian RAB/RAP</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b">
                      <tr className="text-xs text-gray-500">
                        <th className="text-left py-2 px-3">Uraian</th>
                        <th className="text-right py-2 px-3">Volume</th>
                        <th className="text-right py-2 px-3">Sat.</th>
                        <th className="text-right py-2 px-3">HSP Jual</th>
                        <th className="text-right py-2 px-3">RAB (Rp)</th>
                        <th className="text-right py-2 px-3">RAP (Rp)</th>
                        <th className="text-right py-2 px-3">Margin</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {versionDetail.rabLines.map((line: any) => {
                        const margin = parseFloat(line.rabAmount) - parseFloat(line.rapAmount);
                        const marginPct = parseFloat(line.rabAmount) > 0 ? (margin / parseFloat(line.rabAmount)) * 100 : 0;
                        return (
                          <tr key={line.id} className="hover:bg-gray-50">
                            <td className="py-2 px-3 text-gray-700 max-w-xs truncate">{line.description}</td>
                            <td className="py-2 px-3 text-right font-mono text-xs">{parseFloat(line.quantity).toFixed(2)}</td>
                            <td className="py-2 px-3 text-right text-xs text-gray-500">{line.unit}</td>
                            <td className="py-2 px-3 text-right font-mono text-xs">{fmt(line.hspJual)}</td>
                            <td className="py-2 px-3 text-right font-mono font-medium">{fmt(line.rabAmount)}</td>
                            <td className="py-2 px-3 text-right font-mono text-orange-700">{fmt(line.rapAmount)}</td>
                            <td className={`py-2 px-3 text-right text-xs font-semibold ${marginPct >= 10 ? 'text-green-600' : 'text-red-600'}`}>
                              {marginPct.toFixed(1)}%
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-400 bg-gray-50 rounded-lg p-4">
                Belum ada line item. Tambahkan via API: <code className="font-mono text-xs bg-gray-100 px-1 rounded">POST /v1/rab-rap/versions/{selectedVersion.id}/lines</code>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Version Modal */}
      {showCreateVersion && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <form onSubmit={handleCreateVersion} className="bg-white rounded-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-gray-900">Buat Versi Anggaran</h2>
              <button type="button" onClick={() => setShowCreateVersion(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            {error && <div className="text-red-600 text-sm bg-red-50 rounded-lg p-3">{error}</div>}
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-600">Nama Versi *</label>
                <input required value={versionForm.name} onChange={(e) => setVersionForm({ ...versionForm, name: e.target.value })}
                  placeholder="cth: Penawaran Awal, Revision 1, Baseline"
                  className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Deskripsi</label>
                <input value={versionForm.description} onChange={(e) => setVersionForm({ ...versionForm, description: e.target.value })}
                  className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none" />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={versionForm.isBaseline} onChange={(e) => setVersionForm({ ...versionForm, isBaseline: e.target.checked })}
                  className="w-4 h-4 text-brand-600 rounded" />
                <span className="text-sm text-gray-600">Jadikan sebagai Baseline (untuk EVM)</span>
              </label>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setShowCreateVersion(false)}
                className="flex-1 border rounded-lg py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">Batal</button>
              <button type="submit" disabled={saving}
                className="flex-1 bg-brand-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-brand-700 disabled:opacity-50">
                {saving ? 'Menyimpan...' : 'Buat Versi'}
              </button>
            </div>
          </form>
        </div>
      )}

      {!selectedProjectId && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 text-sm text-blue-800">
          <strong>RAB/RAP Engine §6:</strong> Pilih proyek untuk melihat versi anggaran.
          RAB = Rencana Anggaran Biaya (harga jual ke owner, termasuk overhead + profit).
          RAP = Rencana Anggaran Pelaksanaan (biaya internal).
          Margin = RAB − RAP.
        </div>
      )}
    </div>
  );
}
