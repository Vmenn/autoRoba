'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface PunchList {
  id: string;
  listNumber: string;
  title: string;
  system?: string;
  discipline?: string;
  isCompleted: boolean;
  project?: { code: string; name: string };
  _count?: { items: number };
}

interface PunchItem {
  id: string;
  itemNo: string;
  description: string;
  category: string;
  status: string;
  location?: string;
  dueDate?: string;
}

const CAT_COLORS: Record<string, string> = {
  A: 'bg-red-100 text-red-800',
  B: 'bg-yellow-100 text-yellow-800',
  C: 'bg-blue-100 text-blue-700',
};

const STATUS_COLORS: Record<string, string> = {
  OPEN: 'bg-red-50 text-red-700',
  CLEARED: 'bg-yellow-50 text-yellow-700',
  ACCEPTED: 'bg-green-50 text-green-700',
  VOID: 'bg-gray-100 text-gray-400',
};

export default function PunchListPage() {
  const [lists, setLists] = useState<PunchList[]>([]);
  const [total, setTotal] = useState(0);
  const [selected, setSelected] = useState<(PunchList & { items: PunchItem[] }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [projects, setProjects] = useState<{ id: string; code: string; name: string }[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({ projectId: '', title: '', system: '', discipline: '' });

  const load = async () => {
    try {
      setLoading(true);
      const [listRes, projRes] = await Promise.all([
        api.get('/v1/punch-lists').then((r) => r.data),
        api.get('/v1/projects').then((r) => r.data),
      ]);
      setLists(listRes.items ?? []);
      setTotal(listRes.total ?? 0);
      setProjects(projRes.items ?? []);
    } finally {
      setLoading(false);
    }
  };

  const loadDetail = async (id: string) => {
    setDetailLoading(true);
    const res = await api.get(`/v1/punch-lists/${id}`).then((r) => r.data);
    setSelected(res);
    setDetailLoading(false);
  };

  useEffect(() => { load(); }, []);

  const submitCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post('/v1/punch-lists', {
      projectId: createForm.projectId, title: createForm.title,
      system: createForm.system || undefined, discipline: createForm.discipline || undefined,
    });
    setShowCreateModal(false);
    setCreateForm({ projectId: '', title: '', system: '', discipline: '' });
    load();
  };

  const clearItem = async (itemId: string) => {
    if (!selected) return;
    await api.patch(`/v1/punch-lists/${selected.id}/items/${itemId}/clear`);
    loadDetail(selected.id);
  };

  const acceptItem = async (itemId: string) => {
    if (!selected) return;
    await api.patch(`/v1/punch-lists/${selected.id}/items/${itemId}/accept`);
    loadDetail(selected.id);
  };

  const openCount = selected?.items.filter((i) => i.status === 'OPEN').length ?? 0;
  const clearedCount = selected?.items.filter((i) => i.status === 'CLEARED').length ?? 0;
  const acceptedCount = selected?.items.filter((i) => i.status === 'ACCEPTED').length ?? 0;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Punch List</h1>
          <p className="text-sm text-gray-500 mt-1">{total} punch list terdaftar</p>
        </div>
        <button onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
          + Buat Punch List
        </button>
      </div>

      <div className="flex gap-4">
        {/* List panel */}
        <div className="w-80 shrink-0">
          {loading ? (
            <div className="text-center py-8 text-gray-400 text-sm">Memuat...</div>
          ) : lists.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">Belum ada punch list</div>
          ) : (
            <div className="space-y-2">
              {lists.map((list) => (
                <button key={list.id} onClick={() => loadDetail(list.id)}
                  className={`w-full text-left bg-white rounded-xl border px-4 py-3 hover:shadow-sm transition ${selected?.id === list.id ? 'border-blue-500 ring-1 ring-blue-400' : 'border-gray-200'}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-xs text-gray-500">{list.listNumber}</span>
                    <span className="text-xs text-gray-400">{list._count?.items ?? 0} items</span>
                  </div>
                  <div className="font-medium text-gray-900 text-sm">{list.title}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{list.project?.code} · {list.discipline ?? list.system ?? '—'}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Detail panel */}
        <div className="flex-1 min-w-0">
          {!selected ? (
            <div className="text-center py-20 text-gray-400">← Pilih punch list untuk melihat detail item</div>
          ) : detailLoading ? (
            <div className="text-center py-20 text-gray-400">Memuat detail...</div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200">
              <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-gray-900">{selected.title}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{selected.listNumber} · {selected.project?.code}</div>
                </div>
                <div className="flex gap-3 text-xs">
                  <span className="text-red-600 font-semibold">{openCount} Open</span>
                  <span className="text-yellow-600 font-semibold">{clearedCount} Cleared</span>
                  <span className="text-green-600 font-semibold">{acceptedCount} Accepted</span>
                </div>
              </div>
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold text-gray-600 w-12">No</th>
                    <th className="px-3 py-2 text-left font-semibold text-gray-600 w-10">Cat</th>
                    <th className="px-3 py-2 text-left font-semibold text-gray-600">Deskripsi</th>
                    <th className="px-3 py-2 text-left font-semibold text-gray-600 w-24">Status</th>
                    <th className="px-3 py-2 text-left font-semibold text-gray-600 w-24">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {selected.items.map((item) => (
                    <tr key={item.id} className={`hover:bg-gray-50 ${item.status === 'ACCEPTED' ? 'opacity-60' : ''}`}>
                      <td className="px-3 py-2 font-mono text-xs text-gray-400">{item.itemNo}</td>
                      <td className="px-3 py-2">
                        <span className={`px-1.5 py-0.5 rounded text-xs font-bold ${CAT_COLORS[item.category]}`}>{item.category}</span>
                      </td>
                      <td className="px-3 py-2 text-gray-800">{item.description}</td>
                      <td className="px-3 py-2">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[item.status]}`}>{item.status}</span>
                      </td>
                      <td className="px-3 py-2">
                        {item.status === 'OPEN' && (
                          <button onClick={() => clearItem(item.id)} className="text-xs text-yellow-600 hover:text-yellow-800">Clear</button>
                        )}
                        {item.status === 'CLEARED' && (
                          <button onClick={() => acceptItem(item.id)} className="text-xs text-green-600 hover:text-green-800">Accept</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold mb-4">Buat Punch List</h2>
            <form onSubmit={submitCreate} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Proyek *</label>
                <select required value={createForm.projectId} onChange={(e) => setCreateForm({ ...createForm, projectId: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                  <option value="">Pilih proyek...</option>
                  {projects.map((p) => <option key={p.id} value={p.id}>{p.code} — {p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Judul *</label>
                <input required value={createForm.title} onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                  placeholder="e.g. Mechanical Pre-commissioning Area A" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">System</label>
                  <input value={createForm.system} onChange={(e) => setCreateForm({ ...createForm, system: e.target.value })}
                    placeholder="e.g. SYS-001" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Disiplin</label>
                  <input value={createForm.discipline} onChange={(e) => setCreateForm({ ...createForm, discipline: e.target.value })}
                    placeholder="MECH, CIVIL..." className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-sm rounded-lg border border-gray-300 hover:bg-gray-50">Batal</button>
                <button type="submit"
                  className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700">Buat</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
