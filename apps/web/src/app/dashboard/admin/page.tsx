'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface UserRow {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
  roles: string[];
}

interface TenantStats {
  activeUsers: number;
  totalProjects: number;
  totalJobs: number;
  totalNcrs: number;
}

export default function AdminPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [stats, setStats] = useState<TenantStats | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      setLoading(true);
      const [userRes, statsRes] = await Promise.all([
        api.get('/v1/admin/users').then((r) => r.data),
        api.get('/v1/admin/stats').then((r) => r.data),
      ]);
      setUsers(Array.isArray(userRes) ? userRes : []);
      setStats(statsRes);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const toggle = async (id: string) => {
    await api.patch(`/v1/admin/users/${id}/toggle`);
    load();
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
        <p className="text-sm text-gray-500 mt-1">Manajemen pengguna dan konfigurasi tenant</p>
      </div>

      {stats && (
        <div className="grid grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Pengguna Aktif', value: stats.activeUsers, color: 'text-blue-600' },
            { label: 'Total Proyek', value: stats.totalProjects, color: 'text-green-600' },
            { label: 'Total Jobs', value: stats.totalJobs, color: 'text-purple-600' },
            { label: 'Total NCR', value: stats.totalNcrs, color: 'text-orange-600' },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="text-xs text-gray-500 mb-1">{s.label}</div>
              <div className={`text-3xl font-bold ${s.color}`}>{s.value}</div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Daftar Pengguna</h2>
          <span className="text-sm text-gray-500">{users.length} pengguna</span>
        </div>
        {loading ? (
          <div className="text-center py-12 text-gray-400">Memuat...</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Nama</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Email</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Role</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Login Terakhir</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Status</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((u) => (
                <tr key={u.id} className={`hover:bg-gray-50 ${!u.isActive ? 'opacity-50' : ''}`}>
                  <td className="px-4 py-3 font-medium text-gray-900">{u.firstName} {u.lastName}</td>
                  <td className="px-4 py-3 text-gray-500">{u.email}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {u.roles.map((r) => (
                        <span key={r} className="bg-blue-50 text-blue-700 text-xs px-1.5 py-0.5 rounded">{r}</span>
                      ))}
                      {u.roles.length === 0 && <span className="text-gray-400 text-xs">—</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString('id-ID') : 'Belum pernah'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${u.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}`}>
                      {u.isActive ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggle(u.id)}
                      className={`text-xs font-medium ${u.isActive ? 'text-red-500 hover:text-red-700' : 'text-green-600 hover:text-green-800'}`}>
                      {u.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
