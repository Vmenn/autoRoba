'use client';

import { useState, useEffect } from 'react';
import { analyticsApi, projectApi } from '@/lib/api';

function fmt(n: any, dec = 0) {
  return new Intl.NumberFormat('id-ID', { minimumFractionDigits: dec, maximumFractionDigits: dec }).format(Number(n));
}

function EVMCard({ label, value, unit, color, sub }: { label: string; value: any; unit?: string; color: string; sub?: string }) {
  return (
    <div className="bg-white rounded-xl border p-4 space-y-1">
      <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</div>
      <div className={`text-2xl font-bold ${color}`}>
        {unit === 'IDR' ? `Rp ${fmt(value)}` : unit ? `${parseFloat(value).toFixed(2)} ${unit}` : parseFloat(value).toFixed(2)}
      </div>
      {sub && <div className="text-xs text-gray-400">{sub}</div>}
    </div>
  );
}

export default function AnalyticsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [evm, setEvm] = useState<any>(null);
  const [budgetVsActual, setBudgetVsActual] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => { projectApi.list().then(setProjects).catch(console.error); }, []);

  useEffect(() => {
    if (!selectedProjectId) return;
    setLoading(true);
    Promise.all([
      analyticsApi.evm(selectedProjectId),
      analyticsApi.budgetVsActual(selectedProjectId),
    ]).then(([e, b]) => { setEvm(e); setBudgetVsActual(b); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedProjectId]);

  const getIndicatorColor = (val: number, threshold = 1.0) => {
    if (val >= threshold * 1.05) return 'text-green-600';
    if (val >= threshold * 0.95) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analytics & EVM</h1>
        <p className="text-gray-500 mt-1">Earned Value Management — BAC · PV · EV · AC · SPI · CPI</p>
      </div>

      {/* Project Selector */}
      <div className="bg-white rounded-xl border p-5">
        <label className="text-sm font-medium text-gray-600 block mb-2">Pilih Proyek</label>
        <select
          value={selectedProjectId}
          onChange={(e) => setSelectedProjectId(e.target.value)}
          className="w-full max-w-md border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
        >
          <option value="">— Pilih proyek untuk analisis EVM —</option>
          {projects.map((p: any) => (
            <option key={p.id} value={p.id}>{p.code} — {p.name}</option>
          ))}
        </select>
      </div>

      {loading && <div className="text-gray-400 text-sm">Menghitung EVM...</div>}

      {evm && !loading && (
        <>
          <div>
            <h2 className="text-lg font-semibold text-gray-800 mb-3">Earned Value Metrics</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <EVMCard label="BAC" value={evm.evm.bac} unit="IDR" color="text-gray-700" sub="Budget at Completion" />
              <EVMCard label="PV" value={evm.evm.pv} unit="IDR" color="text-blue-700" sub="Planned Value" />
              <EVMCard label="EV" value={evm.evm.ev} unit="IDR" color="text-teal-700" sub="Earned Value" />
              <EVMCard label="AC" value={evm.evm.ac} unit="IDR" color="text-orange-700" sub="Actual Cost" />
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-800 mb-3">Performance Indices</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <EVMCard
                label="SPI"
                value={evm.evm.spi}
                color={getIndicatorColor(parseFloat(evm.evm.spi))}
                sub={parseFloat(evm.evm.spi) >= 1 ? 'Ahead of schedule' : parseFloat(evm.evm.spi) >= 0.9 ? 'Slightly behind' : 'Behind schedule'}
              />
              <EVMCard
                label="CPI"
                value={evm.evm.cpi}
                color={getIndicatorColor(parseFloat(evm.evm.cpi))}
                sub={parseFloat(evm.evm.cpi) >= 1 ? 'Under budget' : parseFloat(evm.evm.cpi) >= 0.9 ? 'Slightly over' : 'Over budget'}
              />
              <EVMCard label="SV" value={evm.evm.svAmount} unit="IDR" color={parseFloat(evm.evm.svAmount) >= 0 ? 'text-green-600' : 'text-red-600'} sub="Schedule Variance" />
              <EVMCard label="CV" value={evm.evm.cvAmount} unit="IDR" color={parseFloat(evm.evm.cvAmount) >= 0 ? 'text-green-600' : 'text-red-600'} sub="Cost Variance" />
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-800 mb-3">Forecast</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <EVMCard label="EAC" value={evm.evm.eac} unit="IDR" color="text-gray-700" sub="Estimate at Completion" />
              <EVMCard label="ETC" value={evm.evm.etc} unit="IDR" color="text-gray-700" sub="Estimate to Complete" />
              <EVMCard label="VAC" value={evm.evm.vac} unit="IDR" color={parseFloat(evm.evm.vac) >= 0 ? 'text-green-600' : 'text-red-600'} sub="Variance at Completion" />
            </div>
          </div>

          {/* WBS Breakdown */}
          {evm.wbsNodes?.length > 0 && (
            <div className="bg-white rounded-xl border p-6">
              <h2 className="font-semibold text-gray-800 mb-4">Breakdown WBS</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b">
                    <tr className="text-xs text-gray-500">
                      <th className="text-left py-2 pr-4">Kode</th>
                      <th className="text-left py-2 pr-4">Nama</th>
                      <th className="text-right py-2 pr-4">Progress</th>
                      <th className="text-right py-2 pr-4">EV (Rp)</th>
                      <th className="text-right py-2">AC (Rp)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {evm.wbsNodes.map((node: any) => (
                      <tr key={node.id}>
                        <td className="py-2 pr-4 font-mono text-xs text-gray-500">{node.code}</td>
                        <td className="py-2 pr-4 text-gray-700">{node.name}</td>
                        <td className="py-2 pr-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-16 bg-gray-100 rounded-full h-1.5">
                              <div className="h-full bg-brand-500 rounded-full" style={{ width: `${Math.min(100, parseFloat(node.progressPct))}%` }} />
                            </div>
                            <span className="text-xs font-mono">{parseFloat(node.progressPct).toFixed(1)}%</span>
                          </div>
                        </td>
                        <td className="py-2 pr-4 text-right font-mono text-xs">{fmt(node.earnedValue)}</td>
                        <td className="py-2 text-right font-mono text-xs">{fmt(node.actualCost)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Budget vs Actual Claims S-Curve */}
      {budgetVsActual && !loading && budgetVsActual.claims?.length > 0 && (
        <div className="bg-white rounded-xl border p-6">
          <h2 className="font-semibold text-gray-800 mb-4">S-Curve — Progress Kumulatif</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b">
                <tr className="text-xs text-gray-500">
                  <th className="text-left py-2 pr-4">No. Klaim</th>
                  <th className="text-right py-2 pr-4">Periode</th>
                  <th className="text-right py-2 pr-4">DPP (Rp)</th>
                  <th className="text-right py-2 pr-4">Periode (%)</th>
                  <th className="text-right py-2">Kumulatif (%)</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {budgetVsActual.claims.map((claim: any) => (
                  <tr key={claim.claimNo}>
                    <td className="py-2 pr-4 font-mono text-xs">{claim.claimNo}</td>
                    <td className="py-2 pr-4 text-right text-xs">{new Date(claim.claimPeriodEnd).toLocaleDateString('id-ID')}</td>
                    <td className="py-2 pr-4 text-right font-mono">{fmt(claim.dppAmount)}</td>
                    <td className="py-2 pr-4 text-right font-mono">{parseFloat(claim.thisPeriodPct).toFixed(1)}%</td>
                    <td className="py-2 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-20 bg-gray-100 rounded-full h-2">
                          <div className="h-full bg-green-500 rounded-full" style={{ width: `${Math.min(100, parseFloat(claim.cumulativePct))}%` }} />
                        </div>
                        <span className="font-mono text-xs">{parseFloat(claim.cumulativePct).toFixed(1)}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!selectedProjectId && (
        <div className="bg-brand-50 border border-brand-200 rounded-xl p-5 text-sm text-brand-800">
          <strong>EVM (Earned Value Management):</strong> Pilih proyek di atas untuk melihat analisis
          SPI (Schedule Performance Index), CPI (Cost Performance Index), EAC (Estimate at Completion),
          dan VAC (Variance at Completion) berdasarkan data WBS dan progress aktual.
        </div>
      )}
    </div>
  );
}
