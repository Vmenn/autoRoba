'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { projectApi } from '@/lib/api';

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-600',
  ACTIVE: 'bg-green-100 text-green-700',
  ON_HOLD: 'bg-yellow-100 text-yellow-700',
  COMPLETED: 'bg-blue-100 text-blue-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

const PROJECT_TYPES = [
  'EPC','RESIDENTIAL','HIGH_RISE','REFINERY','INDUSTRIAL_PLANT','POWER_PLANT',
  'BRIDGE','AIRPORT','PORT','DAM','SMART_CITY','GOVERNMENT_INFRA','TOLL_ROAD','OTHER',
];

function fmt(n: any) {
  return new Intl.NumberFormat('id-ID').format(Number(n));
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [wbs, setWbs] = useState<any[]>([]);
  const [form, setForm] = useState({
    companyId: '', name: '', code: '', type: 'EPC', regionCode: 'ID-JK',
    contractValue: '', currency: 'IDR', startDate: '', endDate: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    projectApi.list().then(setProjects).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openDetail = async (project: any) => {
    setSelected(project);
    try {
      const tree = await projectApi.wbsTree(project.id);
      setWbs(tree ?? []);
    } catch { setWbs([]); }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      const payload = {
        ...form,
        contractValue: form.contractValue ? parseFloat(form.contractValue) : undefined,
        startDate: form.startDate || undefined,
        endDate: form.endDate || undefined,
      };
      await projectApi.create(payload);
      setShowCreate(false);
      setForm({ companyId: '', name: '', code: '', type: 'EPC', regionCode: 'ID-JK', contractValue: '', currency: 'IDR', startDate: '', endDate: '' });
      load();
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Gagal menyimpan proyek');
    } finally { setSaving(false); }
  };

  const WBSTree = ({ nodes, depth = 0 }: { nodes: any[]; depth?: number }) => (
    <div>
      {nodes.map((node: any) => (
        <div key={node.id}>
          <div className={`flex items-center gap-2 py-1.5 ${depth > 0 ? 'ml-' + (depth * 4) : ''}`}
            style={{ paddingLeft: `${depth * 16 + 8}px` }}>
            <div className="w-px h-4 bg-gray-200" style={{ display: depth > 0 ? 'block' : 'none' }} />
            <div>
              <span className="text-xs font-mono text-gray-400">{node.code}</span>
              <span className="text-sm text-gray-700 ml-2">{node.name}</span>
            </div>
            <div className="ml-auto flex items-center gap-2 text-xs text-gray-400">
              <span>{parseFloat(node.progressPct ?? 0).toFixed(1)}%</span>
              {node.weight > 0 && <span className="text-brand-600 font-medium">{parseFloat(node.weight).toFixed(2)} bobot</span>}
            </div>
          </div>
          {node.children?.length > 0 && <WBSTree nodes={node.children} depth={depth + 1} />}
        </div>
      ))}
    </div>
  );

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Proyek</h1>
          <p className="text-gray-500 mt-1">Total: {projects.length} proyek</p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 transition">
          + Buat Proyek
        </button>
      </div>

      {loading ? (
        <div className="text-gray-400 text-sm">Memuat...</div>
      ) : projects.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-4xl mb-2">🏗</div>
          <div>Belum ada proyek. Buat proyek pertama!</div>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((p) => (
            <div key={p.id} onClick={() => openDetail(p)}
              className="bg-white rounded-xl border p-5 cursor-pointer hover:shadow-md transition space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-bold text-gray-900">{p.name}</div>
                  <div className="text-xs font-mono text-gray-400 mt-0.5">{p.code}</div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[p.status]}`}>{p.status}</span>
              </div>
              <div className="flex gap-2 flex-wrap text-xs">
                <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{p.type}</span>
                {p.regionCode && <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{p.regionCode}</span>}
              </div>
              {p.contractValue && (
                <div>
                  <div className="text-xs text-gray-400">Nilai Kontrak</div>
                  <div className="font-bold text-brand-700">Rp {fmt(p.contractValue)}</div>
                </div>
              )}
              {(p.startDate || p.endDate) && (
                <div className="text-xs text-gray-500">
                  {p.startDate && new Date(p.startDate).toLocaleDateString('id-ID')}
                  {p.startDate && p.endDate && ' — '}
                  {p.endDate && new Date(p.endDate).toLocaleDateString('id-ID')}
                </div>
              )}
              <div className="flex gap-3 text-xs text-gray-400 border-t pt-2">
                <span>{p._count?.jobs ?? 0} jobs</span>
                <span>{p._count?.wbsNodes ?? 0} WBS</span>
                <span>{p._count?.budgetVersions ?? 0} anggaran</span>
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
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-gray-900">{selected.name}</h2>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[selected.status]}`}>{selected.status}</span>
                </div>
                <div className="text-xs font-mono text-gray-400 mt-0.5">{selected.code} · {selected.type}</div>
              </div>
              <button onClick={() => { setSelected(null); setWbs([]); }} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              {selected.contractValue && (
                <div className="col-span-2 bg-brand-50 rounded-lg p-3">
                  <div className="text-xs text-brand-600">Nilai Kontrak</div>
                  <div className="text-2xl font-bold text-brand-800">Rp {fmt(selected.contractValue)}</div>
                </div>
              )}
              {selected.regionCode && <div><span className="font-medium">Wilayah:</span> {selected.regionCode}</div>}
              {selected.startDate && <div><span className="font-medium">Mulai:</span> {new Date(selected.startDate).toLocaleDateString('id-ID')}</div>}
              {selected.endDate && <div><span className="font-medium">Selesai:</span> {new Date(selected.endDate).toLocaleDateString('id-ID')}</div>}
            </div>

            {/* Quick links */}
            <div className="flex gap-2 flex-wrap">
              <Link href={`/dashboard/analytics?project=${selected.id}`}
                className="text-xs bg-brand-100 text-brand-700 px-3 py-1.5 rounded-lg font-medium hover:bg-brand-200">
                📊 Analytics & EVM
              </Link>
              <Link href={`/dashboard/progress-claims?project=${selected.id}`}
                className="text-xs bg-green-100 text-green-700 px-3 py-1.5 rounded-lg font-medium hover:bg-green-200">
                💰 Progress Claims
              </Link>
              <Link href={`/dashboard/ncr?project=${selected.id}`}
                className="text-xs bg-orange-100 text-orange-700 px-3 py-1.5 rounded-lg font-medium hover:bg-orange-200">
                ⚠️ NCR
              </Link>
              <Link href={`/dashboard/rfi?project=${selected.id}`}
                className="text-xs bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg font-medium hover:bg-blue-200">
                ❓ RFI
              </Link>
            </div>

            {/* WBS Tree */}
            {wbs.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-700 mb-2">WBS Structure</h3>
                <div className="bg-gray-50 rounded-xl border p-3">
                  <WBSTree nodes={wbs} />
                </div>
              </div>
            )}
            {wbs.length === 0 && (
              <div className="text-sm text-gray-400 bg-gray-50 rounded-lg p-3">
                Belum ada WBS node. Tambahkan via API: <code className="font-mono bg-gray-100 px-1 rounded">POST /v1/projects/{selected.id}/wbs</code>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <form onSubmit={handleCreate} className="bg-white rounded-2xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-gray-900">Buat Proyek Baru</h2>
              <button type="button" onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            {error && <div className="text-red-600 text-sm bg-red-50 rounded-lg p-3">{error}</div>}
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-600">Kode Proyek *</label>
                  <input required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                    maxLength={20} placeholder="PRJ-001"
                    className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Tipe Proyek</label>
                  <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none">
                    {PROJECT_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Nama Proyek *</label>
                <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-600">Nilai Kontrak (Rp)</label>
                  <input type="number" value={form.contractValue} onChange={(e) => setForm({ ...form, contractValue: e.target.value })}
                    placeholder="0"
                    className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Wilayah</label>
                  <select value={form.regionCode} onChange={(e) => setForm({ ...form, regionCode: e.target.value })}
                    className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none">
                    <option value="ID-JK">DKI Jakarta</option>
                    <option value="ID-JB">Jawa Barat</option>
                    <option value="ID-JT">Jawa Tengah</option>
                    <option value="ID-JI">Jawa Timur</option>
                    <option value="ID-BT">Banten</option>
                    <option value="ID-KT">Kalimantan Timur</option>
                    <option value="ID-SU">Sumatera Utara</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-600">Tanggal Mulai</label>
                  <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Tanggal Selesai</label>
                  <input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                    className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none" />
                </div>
              </div>
              <div className="text-xs text-gray-400 bg-yellow-50 rounded-lg p-2">
                Catatan: CompanyId akan diisi otomatis dari data demo tenant saat seed.
                Untuk produksi, pilih perusahaan dari list.
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setShowCreate(false)}
                className="flex-1 border rounded-lg py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">Batal</button>
              <button type="submit" disabled={saving}
                className="flex-1 bg-brand-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-brand-700 disabled:opacity-50">
                {saving ? 'Menyimpan...' : 'Buat Proyek'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
