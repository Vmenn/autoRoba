'use client';

import { useState, useEffect } from 'react';
import { ahspApi } from '@/lib/api';

function fmt(n: string | number) {
  return new Intl.NumberFormat('id-ID').format(Number(n));
}

export default function AHSPPage() {
  const [items, setItems] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [regionCode, setRegionCode] = useState('ID-JK');
  const [calcDate, setCalcDate] = useState(new Date().toISOString().slice(0, 10));
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    ahspApi.list().then(setItems).catch(console.error);
  }, []);

  const calculate = async () => {
    if (!selectedId) return;
    setLoading(true);
    setError('');
    try {
      const r = await ahspApi.calculate({
        ahspItemId: selectedId,
        regionCode,
        calculationDate: calcDate,
      });
      setResult(r);
    } catch (e: any) {
      setError(e.response?.data?.message ?? 'Kalkulasi gagal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">AHSP Engine</h1>
        <p className="text-gray-500 mt-1">
          Analisa Harga Satuan Pekerjaan — SE DJBK 68/2024 / Permen PUPR 1/2022
        </p>
      </div>

      <div className="bg-white rounded-xl border p-6 space-y-4">
        <h2 className="font-semibold text-gray-700">Kalkulator HSP</h2>

        <div className="grid md:grid-cols-3 gap-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-600">Item AHSP</label>
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
            >
              <option value="">— Pilih item —</option>
              {items.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.code} — {item.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-600">Region (Provinsi)</label>
            <select
              value={regionCode}
              onChange={(e) => setRegionCode(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
            >
              <option value="ID-JK">DKI Jakarta</option>
              <option value="ID-JB">Jawa Barat</option>
              <option value="ID-JT">Jawa Tengah</option>
              <option value="ID-JI">Jawa Timur</option>
              <option value="ID-BT">Banten</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-600">Tanggal Hitung</label>
            <input
              type="date"
              value={calcDate}
              onChange={(e) => setCalcDate(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
            />
          </div>
        </div>

        {error && (
          <div className="text-red-600 text-sm bg-red-50 rounded-lg p-3">{error}</div>
        )}

        <button
          onClick={calculate}
          disabled={!selectedId || loading}
          className="bg-brand-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 transition disabled:opacity-50"
        >
          {loading ? 'Menghitung...' : 'Hitung HSP'}
        </button>
      </div>

      {result && (
        <div className="bg-white rounded-xl border p-6 space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="font-semibold text-gray-800">{result.ahspItemName}</h2>
              <div className="text-sm text-gray-500">
                {result.ahspItemCode} · {result.unit} · {result.regionCode} · {result.calculationDate}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-400">HSP (incl. OH + Profit)</div>
              <div className="text-2xl font-bold text-brand-700">
                Rp {fmt(result.hspWithOverheadProfit)}
              </div>
              <div className="text-xs text-gray-400">per {result.unit}</div>
            </div>
          </div>

          {/* Components table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 border-b">
                  <th className="pb-2 pr-4">Jenis</th>
                  <th className="pb-2 pr-4">Uraian</th>
                  <th className="pb-2 pr-4 text-right">Satuan</th>
                  <th className="pb-2 pr-4 text-right">Koefisien</th>
                  <th className="pb-2 pr-4 text-right">Harga Sat.</th>
                  <th className="pb-2 text-right">Jumlah (Rp)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {result.components.map((c: any) => (
                  <tr key={c.componentId}>
                    <td className="py-1.5 pr-4">
                      <span className={`text-xs px-1.5 py-0.5 rounded ${
                        c.type === 'LABOR' ? 'bg-blue-100 text-blue-700' :
                        c.type === 'MATERIAL' ? 'bg-green-100 text-green-700' :
                        'bg-orange-100 text-orange-700'
                      }`}>{c.type[0]}</span>
                    </td>
                    <td className="py-1.5 pr-4 text-gray-700">{c.description}</td>
                    <td className="py-1.5 pr-4 text-right text-gray-500">{c.unit}</td>
                    <td className="py-1.5 pr-4 text-right font-mono">{c.coefficient}</td>
                    <td className="py-1.5 pr-4 text-right font-mono">{fmt(c.unitPrice)}</td>
                    <td className="py-1.5 text-right font-mono font-medium">{fmt(c.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="border-t pt-4 grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
            <div className="bg-blue-50 rounded-lg p-3">
              <div className="text-xs text-blue-600 font-medium">Tenaga Kerja (L)</div>
              <div className="font-bold text-blue-800 mt-0.5">Rp {fmt(result.laborTotal)}</div>
            </div>
            <div className="bg-green-50 rounded-lg p-3">
              <div className="text-xs text-green-600 font-medium">Bahan (M)</div>
              <div className="font-bold text-green-800 mt-0.5">Rp {fmt(result.materialTotal)}</div>
            </div>
            <div className="bg-orange-50 rounded-lg p-3">
              <div className="text-xs text-orange-600 font-medium">Peralatan (E)</div>
              <div className="font-bold text-orange-800 mt-0.5">Rp {fmt(result.equipmentTotal)}</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-xs text-gray-500 font-medium">Overhead ({result.overheadPct}%)</div>
              <div className="font-bold text-gray-700 mt-0.5">Rp {fmt(result.overheadAmount)}</div>
            </div>
            <div className="bg-brand-50 rounded-lg p-3">
              <div className="text-xs text-brand-600 font-medium">HSP Final</div>
              <div className="font-bold text-brand-800 mt-0.5">Rp {fmt(result.hspWithOverheadProfit)}</div>
            </div>
          </div>

          {result.warnings?.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
              <strong>Peringatan:</strong>
              <ul className="list-disc ml-4 mt-1 space-y-1">
                {result.warnings.map((w: string, i: number) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
