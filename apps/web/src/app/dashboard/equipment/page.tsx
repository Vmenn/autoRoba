'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface Equipment {
  id: string;
  equipmentCode: string;
  name: string;
  category: string;
  brand?: string;
  model?: string;
  year?: number;
  status: string;
  currentProjectId?: string;
  project?: { code: string; name: string };
  hourlyRate?: number;
  dailyRate?: number;
}

const STATUS_COLORS: Record<string, string> = {
  AVAILABLE: 'bg-green-100 text-green-800',
  DEPLOYED: 'bg-blue-100 text-blue-800',
  MAINTENANCE: 'bg-yellow-100 text-yellow-800',
  RETIRED: 'bg-gray-100 text-gray-600',
};

export default function EquipmentPage() {
  const [items, setItems] = useState<Equipment[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    name: '', category: '', brand: '', model: '', year: '',
    hourlyRate: '', dailyRate: '',
  });

  const load = async () => {
    try {
      setLoading(true);
      const res = await api.get('/v1/equipment').then((r) => r.data);
      setItems(res.items ?? []);
      setTotal(res.total ?? 0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post('/v1/equipment', {
      name: form.name,
      category: form.category,
      brand: form.brand || undefined,
      model: form.model || undefined,
      year: form.year ? Number(form.year) : undefined,
      hourlyRate: form.hourlyRate ? Number(form.hourlyRate) : undefined,
      dailyRate: form.dailyRate ? Number(form.dailyRate) : undefined,
    });
    setShowModal(false);
    setForm({ name: '', category: '', brand: '', model: '', year: '', hourlyRate: '', dailyRate: '' });
    load();
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Peralatan</h1>
          <p className="text-sm text-gray-500 mt-1">{total} unit terdaftar</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          + Tambah Peralatan
        </button>
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400">Memuat...</div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 text-gray-400">Belum ada peralatan terdaftar</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Kode</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Nama</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Kategori</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Brand / Model</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Status</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Proyek</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-600">Rate/Hari</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((eq) => (
                <tr key={eq.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{eq.equipmentCode}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{eq.name}</td>
                  <td className="px-4 py-3 text-gray-600">{eq.category}</td>
                  <td className="px-4 py-3 text-gray-500">{[eq.brand, eq.model, eq.year].filter(Boolean).join(' / ')}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[eq.status] ?? 'bg-gray-100 text-gray-600'}`}>
                      {eq.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{eq.project ? `${eq.project.code} — ${eq.project.name}` : '—'}</td>
                  <td className="px-4 py-3 text-right text-gray-700">
                    {eq.dailyRate ? `Rp ${Number(eq.dailyRate).toLocaleString('id-ID')}` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
            <h2 className="text-lg font-bold mb-4">Tambah Peralatan Baru</h2>
            <form onSubmit={submit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Nama *</label>
                  <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Kategori *</label>
                  <input required value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                    placeholder="e.g. EXCAVATOR" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Brand</label>
                  <input value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Model</label>
                  <input value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Tahun</label>
                  <input type="number" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Rate/Jam (Rp)</label>
                  <input type="number" value={form.hourlyRate} onChange={(e) => setForm({ ...form, hourlyRate: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Rate/Hari (Rp)</label>
                  <input type="number" value={form.dailyRate} onChange={(e) => setForm({ ...form, dailyRate: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
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
