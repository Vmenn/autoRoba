'use client';

import { useState, useEffect } from 'react';
import { claimApi, projectApi } from '@/lib/api';

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-600',
  SUBMITTED: 'bg-blue-100 text-blue-700',
  UNDER_REVIEW: 'bg-yellow-100 text-yellow-700',
  APPROVED: 'bg-teal-100 text-teal-700',
  REJECTED: 'bg-red-100 text-red-700',
  CERTIFIED: 'bg-purple-100 text-purple-700',
  PAID: 'bg-green-100 text-green-700',
  VOID: 'bg-gray-100 text-gray-400',
};

const TRANSITIONS: Record<string, string[]> = {
  DRAFT: ['SUBMITTED'],
  SUBMITTED: ['UNDER_REVIEW', 'REJECTED'],
  UNDER_REVIEW: ['APPROVED', 'REJECTED'],
  APPROVED: ['CERTIFIED'],
  CERTIFIED: ['PAID'],
  REJECTED: ['DRAFT'],
};

function fmt(n: any) {
  return new Intl.NumberFormat('id-ID').format(Number(n));
}

export default function ProgressClaimsPage() {
  const [claims, setClaims] = useState<{ items: any[]; total: number }>({ items: [], total: 0 });
  const [projects, setProjects] = useState<any[]>([]);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterProject, setFilterProject] = useState('');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);
  const [selectedDetail, setSelectedDetail] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const load = () => {
    setLoading(true);
    claimApi.list({ status: filterStatus || undefined, projectId: filterProject || undefined })
      .then(setClaims).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [filterStatus, filterProject]);
  useEffect(() => { projectApi.list().then(setProjects).catch(console.error); }, []);

  const openDetail = async (claim: any) => {
    setSelected(claim);
    setDetailLoading(true);
    try {
      const detail = await claimApi.get(claim.id);
      setSelectedDetail(detail);
    } catch (e) { console.error(e); }
    finally { setDetailLoading(false); }
  };

  const handleTransition = async (id: string, toStatus: string) => {
    try { await claimApi.transition(id, toStatus); load(); setSelected(null); setSelectedDetail(null); }
    catch (err: any) { alert(err.response?.data?.message ?? 'Gagal transisi'); }
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Progress Claims</h1>
          <p className="text-gray-500 mt-1">Termin — DPP / PPN / PPh Final — Total: {claims.total}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none">
          <option value="">Semua Status</option>
          {Object.keys(STATUS_COLORS).map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filterProject} onChange={(e) => setFilterProject(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none">
          <option value="">Semua Proyek</option>
          {projects.map((p: any) => <option key={p.id} value={p.id}>{p.code} — {p.name}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="text-gray-400 text-sm">Memuat...</div>
      ) : claims.items.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-4xl mb-2">💰</div>
          <div>Belum ada progress claim</div>
          <div className="text-sm mt-2">Buat claim via API: <code className="font-mono bg-gray-100 px-1 rounded">POST /v1/progress-claims</code></div>
        </div>
      ) : (
        <div className="space-y-3">
          {claims.items.map((claim) => (
            <div key={claim.id} onClick={() => openDetail(claim)}
              className="bg-white rounded-xl border p-5 cursor-pointer hover:shadow-sm transition">
              <div className="flex justify-between items-start gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono text-gray-400">{claim.claimNo}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[claim.status]}`}>{claim.status}</span>
                  </div>
                  <div className="font-medium text-gray-800">{claim.project?.name}</div>
                  <div className="text-sm text-gray-500">
                    Periode: {new Date(claim.claimPeriodStart).toLocaleDateString('id-ID')} —{' '}
                    {new Date(claim.claimPeriodEnd).toLocaleDateString('id-ID')}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xs text-gray-400">DPP</div>
                  <div className="font-bold text-brand-700">Rp {fmt(claim.dppAmount)}</div>
                  <div className="text-xs text-gray-400 mt-1">Net: Rp {fmt(claim.netCashIn)}</div>
                  <div className="text-xs text-gray-500">{parseFloat(claim.thisPeriodPct).toFixed(1)}% periode ini</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-xs font-mono text-gray-400">{selected.claimNo}</div>
                <h2 className="text-lg font-bold text-gray-900">{selected.project?.name}</h2>
              </div>
              <button onClick={() => { setSelected(null); setSelectedDetail(null); }} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[selected.status]}`}>{selected.status}</span>

            {/* Tax Summary */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { label: 'DPP', value: selected.dppAmount, color: 'text-gray-800' },
                { label: 'PPN (11%)', value: selected.ppnAmount, color: 'text-blue-700' },
                { label: 'PPh Final', value: selected.pphAmount, color: 'text-red-600' },
                { label: 'Recoupment', value: selected.recoupmentAmount, color: 'text-orange-600' },
                { label: 'Retensi (5%)', value: selected.retentionAmount, color: 'text-yellow-600' },
                { label: 'Net Cash-In', value: selected.netCashIn, color: 'text-green-700 font-bold text-lg' },
              ].map((item) => (
                <div key={item.label} className="bg-gray-50 rounded-lg p-3">
                  <div className="text-xs text-gray-500">{item.label}</div>
                  <div className={`${item.color} mt-0.5`}>Rp {fmt(item.value)}</div>
                </div>
              ))}
            </div>

            {/* Progress */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-gray-500">
                <span>Kumulatif: {parseFloat(selected.cumulativePct).toFixed(1)}%</span>
                <span>Periode ini: {parseFloat(selected.thisPeriodPct).toFixed(1)}%</span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-brand-500 rounded-full" style={{ width: `${Math.min(100, parseFloat(selected.cumulativePct))}%` }} />
              </div>
            </div>

            {/* Lines */}
            {detailLoading ? (
              <div className="text-gray-400 text-sm">Memuat lines...</div>
            ) : selectedDetail?.lines?.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-700 mb-2">Rincian Item</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b text-gray-500">
                        <th className="text-left py-2 pr-3">Uraian</th>
                        <th className="text-right pr-3">Nilai Kontrak</th>
                        <th className="text-right pr-3">Klaim (%)</th>
                        <th className="text-right">Nilai Klaim</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {selectedDetail.lines.map((line: any) => (
                        <tr key={line.id}>
                          <td className="py-2 pr-3 text-gray-700">{line.description}</td>
                          <td className="py-2 pr-3 text-right font-mono">{fmt(line.contractAmount)}</td>
                          <td className="py-2 pr-3 text-right font-mono">{parseFloat(line.thisClaimPct).toFixed(1)}%</td>
                          <td className="py-2 text-right font-mono font-medium">{fmt(line.thisClaimAmt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Transition buttons */}
            {TRANSITIONS[selected.status]?.length > 0 && (
              <div className="flex gap-2 flex-wrap pt-2 border-t">
                {TRANSITIONS[selected.status].map((toStatus) => (
                  <button key={toStatus} onClick={() => handleTransition(selected.id, toStatus)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium text-white ${
                      toStatus === 'REJECTED' ? 'bg-red-500 hover:bg-red-600' :
                      toStatus === 'PAID' ? 'bg-green-600 hover:bg-green-700' :
                      'bg-brand-600 hover:bg-brand-700'
                    }`}>
                    → {toStatus}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
