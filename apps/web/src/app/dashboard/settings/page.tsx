'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth';

export default function SettingsPage() {
  const { user } = useAuth();
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Pengaturan</h1>
        <p className="text-sm text-gray-500 mt-1">Konfigurasi profil dan preferensi sistem</p>
      </div>

      <div className="space-y-6">
        {/* Profile */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Profil Pengguna</h2>
          <form onSubmit={handleSave} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Nama Depan</label>
                <input defaultValue={user?.firstName} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Nama Belakang</label>
                <input defaultValue={user?.lastName} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
                <input defaultValue={user?.email} disabled className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-400" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button type="submit" className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700">
                Simpan Perubahan
              </button>
              {saved && <span className="text-sm text-green-600">✓ Tersimpan</span>}
            </div>
          </form>
        </div>

        {/* Platform info */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Informasi Platform</h2>
          <div className="grid grid-cols-2 gap-y-3 text-sm">
            {[
              ['Platform', 'AutoRAB X Enterprise EPC v6.0'],
              ['Standar Pajak', 'PMK 44/2022, PP 9/2022, PP 57/2023'],
              ['Standar AHSP', 'SE DJBK 68/2024, SNI-ABK, PUPR 8/2023'],
              ['Regulasi Ketenagakerjaan', 'PP 36/2021, PMK 2/2022'],
              ['Akurasi Numerik', 'Decimal.js precision=28, ROUND_HALF_UP'],
              ['Database', 'PostgreSQL + Prisma ORM'],
              ['Backend', 'NestJS + TypeScript (strict)'],
              ['Frontend', 'Next.js 14 + Tailwind CSS'],
            ].map(([k, v]) => (
              <div key={k}>
                <div className="text-xs text-gray-400 mb-0.5">{k}</div>
                <div className="text-gray-800 font-medium">{v}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Modules */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Modul Aktif</h2>
          <div className="grid grid-cols-3 gap-2">
            {[
              'Auth & RBAC', 'AHSP Engine', 'Tax Engine', 'RAB/RAP Budget',
              'Project & WBS', 'Jobs & Tasks', 'Master Data', 'NCR',
              'RFI', 'Progress Claims', 'Documents', 'Notifications',
              'Analytics & EVM', 'Daily Log', 'Equipment', 'Procurement/PO',
              'HSE & Insiden', 'Permit to Work', 'Variation Orders', 'ITP/QA',
              'Subkontraktor', 'Admin Panel', 'Material MTO', 'Punch List',
              'S-Curve',
            ].map((m) => (
              <div key={m} className="flex items-center gap-2 text-sm">
                <span className="text-green-500">✓</span>
                <span className="text-gray-700">{m}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
