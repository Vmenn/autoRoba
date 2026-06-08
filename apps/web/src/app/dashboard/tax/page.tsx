'use client';

import { useState, useEffect } from 'react';
import { taxApi } from '@/lib/api';

function fmt(n: string | number) {
  return new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(Number(n));
}

const JK_CODES = ['JK-01', 'JK-02', 'JK-03', 'JK-04', 'JK-05', 'JK-06', 'JK-07'];

export default function TaxPage() {
  const [rates, setRates] = useState<any[]>([]);
  const [dpp, setDpp] = useState('3000000000');
  const [rateCode, setRateCode] = useState('JK-04');
  const [recoupmentPct, setRecoupmentPct] = useState('');
  const [retentionPct, setRetentionPct] = useState('5');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    taxApi.rates().then(setRates).catch(console.error);
  }, []);

  const calculate = async () => {
    setLoading(true);
    try {
      const r = await taxApi.calculateProgressClaim({
        dpp: parseFloat(dpp),
        taxRateCode: rateCode,
        recoupmentPct: recoupmentPct ? parseFloat(recoupmentPct) : undefined,
        retentionPct: retentionPct ? parseFloat(retentionPct) : undefined,
      });
      setResult(r);
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const jkRates = rates.filter((r) => JK_CODES.includes(r.code));

  return (
    <div className="p-8 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tax Engine</h1>
        <p className="text-gray-500 mt-1">
          PPh Final Jasa Konstruksi (PP 9/2022) + PPN — §24
        </p>
      </div>

      {/* Rate table */}
      <div className="bg-white rounded-xl border p-6">
        <h2 className="font-semibold text-gray-700 mb-4">Tarif PPh Final Jasa Konstruksi (PP 9/2022)</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-gray-500 border-b">
              <th className="pb-2 pr-4">Kode</th>
              <th className="pb-2 pr-4">Jenis</th>
              <th className="pb-2 pr-4">Kualifikasi</th>
              <th className="pb-2 text-right">Tarif</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {jkRates.map((r) => (
              <tr key={r.code} className={r.code === rateCode ? 'bg-brand-50' : ''}>
                <td className="py-1.5 pr-4 font-mono font-semibold text-brand-700">{r.code}</td>
                <td className="py-1.5 pr-4 text-gray-700">{r.description}</td>
                <td className="py-1.5 pr-4 text-gray-500 text-xs">{r.qualification}</td>
                <td className="py-1.5 text-right font-bold text-gray-900">
                  {(parseFloat(r.rate) * 100).toFixed(2)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Calculator */}
      <div className="bg-white rounded-xl border p-6 space-y-4">
        <h2 className="font-semibold text-gray-700">Kalkulator Nilai Termin</h2>
        <p className="text-xs text-gray-400">
          Formula §22.2: Net = DPP + PPN − PPh Final − Recoupment DP − Retensi
        </p>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-600">DPP (Rp, sebelum PPN)</label>
            <input
              type="number"
              value={dpp}
              onChange={(e) => setDpp(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-600">Kode Tarif PPh Final</label>
            <select
              value={rateCode}
              onChange={(e) => setRateCode(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
            >
              {JK_CODES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-600">Recoupment Uang Muka (%)</label>
            <input
              type="number"
              value={recoupmentPct}
              placeholder="0"
              onChange={(e) => setRecoupmentPct(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-600">Retensi (%)</label>
            <input
              type="number"
              value={retentionPct}
              placeholder="5"
              onChange={(e) => setRetentionPct(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
            />
          </div>
        </div>

        <button
          onClick={calculate}
          disabled={loading}
          className="bg-brand-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 transition disabled:opacity-50"
        >
          {loading ? 'Menghitung...' : 'Hitung'}
        </button>

        {result && (
          <div className="border-t pt-4 space-y-3">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-xs text-gray-500">DPP</div>
                <div className="font-bold text-gray-900">Rp {fmt(result.dpp)}</div>
              </div>
              <div className="bg-green-50 rounded-lg p-3">
                <div className="text-xs text-green-600">+ PPN {(parseFloat(result.ppn.rate) * 100).toFixed(0)}%</div>
                <div className="font-bold text-green-800">Rp {fmt(result.ppn.amount)}</div>
              </div>
              <div className="bg-red-50 rounded-lg p-3">
                <div className="text-xs text-red-600">
                  − PPh Final {result.pphFinal.rateCode} ({(parseFloat(result.pphFinal.rate) * 100).toFixed(2)}%)
                </div>
                <div className="font-bold text-red-800">Rp {fmt(result.pphFinal.amount)}</div>
              </div>
              {parseFloat(result.recoupment) > 0 && (
                <div className="bg-orange-50 rounded-lg p-3">
                  <div className="text-xs text-orange-600">− Recoupment DP</div>
                  <div className="font-bold text-orange-800">Rp {fmt(result.recoupment)}</div>
                </div>
              )}
              {parseFloat(result.retention) > 0 && (
                <div className="bg-yellow-50 rounded-lg p-3">
                  <div className="text-xs text-yellow-600">− Retensi</div>
                  <div className="font-bold text-yellow-800">Rp {fmt(result.retention)}</div>
                </div>
              )}
              <div className="bg-brand-50 rounded-lg p-3 md:col-span-full">
                <div className="text-xs text-brand-600 font-medium">= Net Cash-In</div>
                <div className="text-2xl font-bold text-brand-800">Rp {fmt(result.netCashIn)}</div>
              </div>
            </div>
            <p className="text-xs text-gray-400">{result.notes}</p>
            <p className="text-xs text-gray-400">
              Dasar hukum: {result.pphFinal.legalBasis} · Tanggal: {result.transactionDate}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
