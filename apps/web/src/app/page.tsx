import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-brand-900 via-brand-700 to-brand-500 flex flex-col items-center justify-center text-white px-4">
      <div className="max-w-3xl w-full text-center space-y-8">
        <div>
          <h1 className="text-5xl font-bold tracking-tight">AutoRAB X</h1>
          <p className="text-xl mt-2 text-blue-200">Enterprise EPC Platform v6.0</p>
        </div>

        <p className="text-lg text-blue-100 max-w-2xl mx-auto">
          Platform konstruksi enterprise terpadu berbasis AI, BIM, ERP, IoT, Mobile, dan SaaS.
          Satu-satunya platform yang menggabungkan estimasi–eksekusi–keuangan dengan kepatuhan
          regulasi Indonesia secara native.
        </p>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          {[
            { label: 'AHSP Engine', desc: 'PUPR 1/2022 · SE DJBK 68/2024' },
            { label: 'Tax Engine', desc: 'PPh Final PP 9/2022 · PPN · Coretax' },
            { label: 'RAB / RAP', desc: 'Estimasi jual vs biaya internal' },
            { label: 'Job Management', desc: 'Assign · Kerjakan · Verifikasi' },
            { label: 'WBS + EVM', desc: 'CPM · Kurva-S · CPI/SPI/EAC' },
            { label: 'Offline-First', desc: 'Mobile Flutter · Sync SQLite' },
          ].map((f) => (
            <div key={f.label} className="bg-white/10 backdrop-blur rounded-xl p-4 text-left">
              <div className="font-semibold">{f.label}</div>
              <div className="text-blue-200 mt-1">{f.desc}</div>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/login"
            className="bg-white text-brand-700 font-semibold px-8 py-3 rounded-xl hover:bg-blue-50 transition"
          >
            Masuk ke Platform
          </Link>
          <a
            href="http://localhost:3001/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="border border-white/40 text-white font-semibold px-8 py-3 rounded-xl hover:bg-white/10 transition"
          >
            API Docs (Swagger)
          </a>
        </div>
      </div>
    </main>
  );
}
