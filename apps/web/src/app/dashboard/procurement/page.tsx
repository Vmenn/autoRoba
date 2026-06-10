'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface PO {
  id: string;
  poNumber: string;
  vendorName: string;
  poDate: string;
  status: string;
  totalAmount: number;
  project?: { code: string; name: string };
  description?: string;
}

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-600',
  SUBMITTED: 'bg-blue-100 text-blue-800',
  APPROVED: 'bg-green-100 text-green-800',
  PARTIALLY_RECEIVED: 'bg-yellow-100 text-yellow-800',
  RECEIVED: 'bg-teal-100 text-teal-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

export default function ProcurementPage() {
  const [items, setItems] = useState<PO[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<{ id: string; code: string; name: string }[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    projectId: '', vendorName: '', poDate: '', description: '',
  });
  const [lines, setLines] = useState([{ description: '', qty: '1', unit: 'ls', unitPrice: '' }]);

  const load = async () => {
    try {
      setLoading(true);
      const [poRes, projRes] = await Promise.all([
        api.get('/v1/procurement/pos').then((r) => r.data),
        api.get('/v1/projects').then((r) => r.data),
      ]);
      setItems(poRes.items ?? []);
      setTotal(poRes.total ?? 0);
      setProjects(projRes.items ?? []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const addLine = () => setLines([...lines, { description: '', qty: '1', unit: 'ls', unitPrice: '' }]);
  const updateLine = (i: number, field: string, value: string) => {
    setLines(lines.map((l, idx) => idx === i ? { ...l, [field]: value } : l));
  };
  const removeLine = (i: number) => setLines(lines.filter((_, idx) => idx !== i));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post('/v1/procurement/pos', {
      projectId: form.projectId,
      vendorName: form.vendorName,
      poDate: form.poDate,
      description: form.description || undefined,
      lines: lines.map((l) => ({
        description: l.description,
        qty: Number(l.qty),
        unit: l.unit,
        unitPrice: Number(l.unitPrice),
      })),
    });
    setShowModal(false);
    setForm({ projectId: '', vendorName: '', poDate: '', description: '' });
    setLines([{ description: '', qty: '1', unit: 'ls', unitPrice: '' }]);
    load();
  };

  const totalLines = lines.reduce((s, l) => s + (Number(l.qty) || 0) * (Number(l.unitPrice) || 0), 0);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pengadaan / Purchase Order</h1>
          <p className="text-sm text-gray-500 mt-1">{total} PO terdaftar</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          + Buat PO Baru
        </button>
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400">Memuat...</div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 text-gray-400">Belum ada Purchase Order</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">No. PO</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Vendor</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Proyek</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Tanggal</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Status</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-600">Total (Rp)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((po) => (
                <tr key={po.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs text-gray-700 font-medium">{po.poNumber}</td>
                  <td className="px-4 py-3 text-gray-900">{po.vendorName}</td>
                  <td className="px-4 py-3 text-gray-500">{po.project ? `${po.project.code}` : '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{new Date(po.poDate).toLocaleDateString('id-ID')}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[po.status] ?? 'bg-gray-100 text-gray-600'}`}>
                      {po.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-gray-900">
                    {Number(po.totalAmount).toLocaleString('id-ID')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
            <h2 className="text-lg font-bold mb-4">Buat Purchase Order Baru</h2>
            <form onSubmit={submit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Proyek *</label>
                  <select required value={form.projectId} onChange={(e) => setForm({ ...form, projectId: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                    <option value="">Pilih proyek...</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>{p.code} — {p.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Nama Vendor *</label>
                  <input required value={form.vendorName} onChange={(e) => setForm({ ...form, vendorName: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Tanggal PO *</label>
                  <input required type="date" value={form.poDate} onChange={(e) => setForm({ ...form, poDate: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Deskripsi</label>
                  <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-gray-700">Line Items</label>
                  <button type="button" onClick={addLine}
                    className="text-xs text-blue-600 hover:text-blue-800">+ Tambah Baris</button>
                </div>
                <div className="space-y-2">
                  {lines.map((line, i) => (
                    <div key={i} className="grid grid-cols-12 gap-1.5 items-center">
                      <input placeholder="Deskripsi item" value={line.description}
                        onChange={(e) => updateLine(i, 'description', e.target.value)}
                        className="col-span-5 border border-gray-300 rounded px-2 py-1.5 text-xs" />
                      <input type="number" placeholder="Qty" value={line.qty}
                        onChange={(e) => updateLine(i, 'qty', e.target.value)}
                        className="col-span-2 border border-gray-300 rounded px-2 py-1.5 text-xs" />
                      <input placeholder="Satuan" value={line.unit}
                        onChange={(e) => updateLine(i, 'unit', e.target.value)}
                        className="col-span-2 border border-gray-300 rounded px-2 py-1.5 text-xs" />
                      <input type="number" placeholder="Harga Satuan" value={line.unitPrice}
                        onChange={(e) => updateLine(i, 'unitPrice', e.target.value)}
                        className="col-span-2 border border-gray-300 rounded px-2 py-1.5 text-xs" />
                      <button type="button" onClick={() => removeLine(i)}
                        className="col-span-1 text-red-400 hover:text-red-600 text-center">×</button>
                    </div>
                  ))}
                </div>
                <div className="text-right text-sm font-semibold text-gray-700 mt-2">
                  Total: Rp {totalLines.toLocaleString('id-ID')}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm rounded-lg border border-gray-300 hover:bg-gray-50">Batal</button>
                <button type="submit"
                  className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700">Buat PO</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
