'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface MaterialItem {
  id: string;
  itemCode: string;
  description: string;
  unit: string;
  spec?: string;
  qtyBudget: number;
  qtyOrdered: number;
  qtyReceived: number;
  qtyInstalled: number;
  project?: { code: string; name: string };
}

interface MR {
  id: string;
  mrNumber: string;
  title: string;
  status: string;
  requiredBy: string;
  project?: { code: string; name: string };
  _count?: { lines: number };
}

const MR_STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-600',
  SUBMITTED: 'bg-blue-100 text-blue-800',
  APPROVED: 'bg-green-100 text-green-800',
  PARTIALLY_ISSUED: 'bg-yellow-100 text-yellow-800',
  ISSUED: 'bg-teal-100 text-teal-800',
  CANCELLED: 'bg-red-100 text-red-700',
};

export default function MaterialsPage() {
  const [items, setItems] = useState<MaterialItem[]>([]);
  const [mrs, setMRs] = useState<MR[]>([]);
  const [mrTotal, setMRTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<{ id: string; code: string; name: string }[]>([]);
  const [tab, setTab] = useState<'mto' | 'mr'>('mto');
  const [filterProject, setFilterProject] = useState('');
  const [showItemModal, setShowItemModal] = useState(false);
  const [itemForm, setItemForm] = useState({ projectId: '', itemCode: '', description: '', unit: 'pcs', spec: '', qtyBudget: '' });

  const load = async () => {
    try {
      setLoading(true);
      const params = filterProject ? `?projectId=${filterProject}` : '';
      const [itemRes, mrRes, projRes] = await Promise.all([
        api.get(`/v1/materials/items${params}`).then((r) => r.data),
        api.get(`/v1/materials/requisitions${params}`).then((r) => r.data),
        api.get('/v1/projects').then((r) => r.data),
      ]);
      setItems(Array.isArray(itemRes) ? itemRes : []);
      setMRs(mrRes.items ?? []);
      setMRTotal(mrRes.total ?? 0);
      setProjects(projRes.items ?? []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [filterProject]);

  const submitItem = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post('/v1/materials/items', {
      projectId: itemForm.projectId, itemCode: itemForm.itemCode,
      description: itemForm.description, unit: itemForm.unit,
      spec: itemForm.spec || undefined,
      qtyBudget: itemForm.qtyBudget ? Number(itemForm.qtyBudget) : 0,
    });
    setShowItemModal(false);
    setItemForm({ projectId: '', itemCode: '', description: '', unit: 'pcs', spec: '', qtyBudget: '' });
    load();
  };

  const approveMR = async (id: string) => {
    await api.patch(`/v1/materials/requisitions/${id}/approve`);
    load();
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manajemen Material</h1>
          <p className="text-sm text-gray-500 mt-1">{items.length} item MTO • {mrTotal} Material Requisition</p>
        </div>
        <div className="flex items-center gap-3">
          <select value={filterProject} onChange={(e) => setFilterProject(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
            <option value="">Semua proyek</option>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.code}</option>)}
          </select>
          <button onClick={() => setShowItemModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
            + Item MTO
          </button>
        </div>
      </div>

      <div className="flex gap-1 mb-4 bg-gray-100 rounded-lg p-1 w-fit">
        {(['mto', 'mr'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${tab === t ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}>
            {t === 'mto' ? `MTO (${items.length})` : `Requisitions (${mrTotal})`}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400">Memuat...</div>
      ) : tab === 'mto' ? (
        items.length === 0 ? (
          <div className="text-center py-16 text-gray-400">Belum ada item MTO</div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Kode</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Deskripsi</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Spesifikasi</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-600">Budget</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-600">Dipesan</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-600">Diterima</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-600">Terpasang</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Sat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs text-blue-700 font-medium">{item.itemCode}</td>
                    <td className="px-4 py-3 text-gray-900 max-w-xs">{item.description}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs max-w-xs truncate">{item.spec ?? '—'}</td>
                    <td className="px-4 py-3 text-right text-gray-700">{Number(item.qtyBudget).toLocaleString('id-ID', { maximumFractionDigits: 2 })}</td>
                    <td className="px-4 py-3 text-right text-gray-600">{Number(item.qtyOrdered).toLocaleString('id-ID', { maximumFractionDigits: 2 })}</td>
                    <td className="px-4 py-3 text-right text-gray-600">{Number(item.qtyReceived).toLocaleString('id-ID', { maximumFractionDigits: 2 })}</td>
                    <td className="px-4 py-3 text-right text-gray-600">{Number(item.qtyInstalled).toLocaleString('id-ID', { maximumFractionDigits: 2 })}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{item.unit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : (
        mrs.length === 0 ? (
          <div className="text-center py-16 text-gray-400">Belum ada Material Requisition</div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">No. MR</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Judul</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Proyek</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Dibutuhkan</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-600">Items</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Status</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {mrs.map((mr) => (
                  <tr key={mr.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">{mr.mrNumber}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{mr.title}</td>
                    <td className="px-4 py-3 text-gray-500">{mr.project?.code ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{new Date(mr.requiredBy).toLocaleDateString('id-ID')}</td>
                    <td className="px-4 py-3 text-center text-gray-600">{mr._count?.lines ?? 0}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${MR_STATUS_COLORS[mr.status] ?? 'bg-gray-100'}`}>
                        {mr.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {mr.status === 'SUBMITTED' && (
                        <button onClick={() => approveMR(mr.id)} className="text-xs text-green-600 hover:text-green-800">Approve</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {showItemModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold mb-4">Tambah Item MTO</h2>
            <form onSubmit={submitItem} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Proyek *</label>
                  <select required value={itemForm.projectId} onChange={(e) => setItemForm({ ...itemForm, projectId: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                    <option value="">Pilih...</option>
                    {projects.map((p) => <option key={p.id} value={p.id}>{p.code}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Kode Item *</label>
                  <input required value={itemForm.itemCode} onChange={(e) => setItemForm({ ...itemForm, itemCode: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Deskripsi *</label>
                  <input required value={itemForm.description} onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Spesifikasi</label>
                  <input value={itemForm.spec} onChange={(e) => setItemForm({ ...itemForm, spec: e.target.value })}
                    placeholder="e.g. ASTM A106 Gr.B, 4 inch SCH 40" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Satuan *</label>
                  <input required value={itemForm.unit} onChange={(e) => setItemForm({ ...itemForm, unit: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Qty Budget</label>
                  <input type="number" value={itemForm.qtyBudget} onChange={(e) => setItemForm({ ...itemForm, qtyBudget: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowItemModal(false)}
                  className="px-4 py-2 text-sm rounded-lg border border-gray-300 hover:bg-gray-50">Batal</button>
                <button type="submit"
                  className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700">Tambah</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
