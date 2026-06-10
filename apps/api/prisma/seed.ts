import {
  PrismaClient,
  TaxType,
  HSDType,
  RegulationBasis,
  ComponentType,
  ProjectStatus,
  JobStatus,
  JobType,
  AssigneeType,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  await seedTaxRates();
  await seedRegions();
  await seedSystemRoles();
  await seedDemoTenant();

  console.log('✅ Seed complete.');
}

// ── Tax Rates (PP 9/2022) ─────────────────────────────────────────────────────

async function seedTaxRates() {
  const effectiveFrom = new Date('2022-02-21');
  const legalBasis = 'PP 9/2022 jo. PP 51/2008';

  const rates = [
    { code: 'JK-01', taxType: TaxType.PPH_FINAL_CONSTRUCTION, description: 'PPh Final – Pekerjaan Konstruksi', qualification: 'SBU Kecil / SKK perseorangan', rate: 0.0175 },
    { code: 'JK-02', taxType: TaxType.PPH_FINAL_CONSTRUCTION, description: 'PPh Final – Pekerjaan Konstruksi', qualification: 'Menengah / Besar / Spesialis (bersertifikat)', rate: 0.0265 },
    { code: 'JK-03', taxType: TaxType.PPH_FINAL_CONSTRUCTION, description: 'PPh Final – Pekerjaan Konstruksi', qualification: 'Tanpa SBU / SKK', rate: 0.04 },
    { code: 'JK-04', taxType: TaxType.PPH_FINAL_CONSTRUCTION, description: 'PPh Final – Konstruksi Terintegrasi (EPC)', qualification: 'Memiliki SBU', rate: 0.0265 },
    { code: 'JK-05', taxType: TaxType.PPH_FINAL_CONSTRUCTION, description: 'PPh Final – Konstruksi Terintegrasi (EPC)', qualification: 'Tanpa SBU', rate: 0.04 },
    { code: 'JK-06', taxType: TaxType.PPH_FINAL_CONSTRUCTION, description: 'PPh Final – Konsultansi Konstruksi', qualification: 'Memiliki SBU / SKK', rate: 0.035 },
    { code: 'JK-07', taxType: TaxType.PPH_FINAL_CONSTRUCTION, description: 'PPh Final – Konsultansi Konstruksi', qualification: 'Tanpa SBU / SKK', rate: 0.06 },
    { code: 'PPN', taxType: TaxType.PPN, description: 'Pajak Pertambahan Nilai', qualification: null, rate: 0.11 },
  ];

  for (const r of rates) {
    await prisma.taxRate.upsert({
      where: { id: r.code } as any,
      create: { code: r.code, taxType: r.taxType, description: r.description, qualification: r.qualification, rate: r.rate, effectiveFrom, legalBasis, isActive: true },
      update: { rate: r.rate, isActive: true },
    });
  }

  await prisma.taxRate.upsert({
    where: { id: 'PPN-12' } as any,
    create: { code: 'PPN-12', taxType: TaxType.PPN, description: 'Pajak Pertambahan Nilai (rencana 12%)', qualification: null, rate: 0.12, effectiveFrom: new Date('2999-01-01'), legalBasis: 'UU 7/2021 HPP (belum berlaku)', isActive: false },
    update: {},
  });

  console.log('  ✓ Tax rates');
}

// ── Regions ───────────────────────────────────────────────────────────────────

async function seedRegions() {
  const provinces = [
    { code: 'ID-AC', name: 'Aceh' }, { code: 'ID-SU', name: 'Sumatera Utara' },
    { code: 'ID-SB', name: 'Sumatera Barat' }, { code: 'ID-RI', name: 'Riau' },
    { code: 'ID-JA', name: 'Jambi' }, { code: 'ID-SS', name: 'Sumatera Selatan' },
    { code: 'ID-BG', name: 'Bengkulu' }, { code: 'ID-LA', name: 'Lampung' },
    { code: 'ID-BB', name: 'Kepulauan Bangka Belitung' }, { code: 'ID-KR', name: 'Kepulauan Riau' },
    { code: 'ID-JK', name: 'DKI Jakarta' }, { code: 'ID-JB', name: 'Jawa Barat' },
    { code: 'ID-JT', name: 'Jawa Tengah' }, { code: 'ID-YO', name: 'DI Yogyakarta' },
    { code: 'ID-JI', name: 'Jawa Timur' }, { code: 'ID-BT', name: 'Banten' },
    { code: 'ID-BA', name: 'Bali' }, { code: 'ID-NB', name: 'Nusa Tenggara Barat' },
    { code: 'ID-NT', name: 'Nusa Tenggara Timur' }, { code: 'ID-KB', name: 'Kalimantan Barat' },
    { code: 'ID-KT', name: 'Kalimantan Tengah' }, { code: 'ID-KS', name: 'Kalimantan Selatan' },
    { code: 'ID-KI', name: 'Kalimantan Timur' }, { code: 'ID-KU', name: 'Kalimantan Utara' },
    { code: 'ID-SA', name: 'Sulawesi Utara' }, { code: 'ID-ST', name: 'Sulawesi Tengah' },
    { code: 'ID-SG', name: 'Sulawesi Selatan' }, { code: 'ID-SN', name: 'Sulawesi Tenggara' },
    { code: 'ID-GO', name: 'Gorontalo' }, { code: 'ID-SR', name: 'Sulawesi Barat' },
    { code: 'ID-MA', name: 'Maluku' }, { code: 'ID-MU', name: 'Maluku Utara' },
    { code: 'ID-PA', name: 'Papua' }, { code: 'ID-PB', name: 'Papua Barat' },
  ];

  for (const p of provinces) {
    await prisma.region.upsert({ where: { code: p.code }, create: { code: p.code, name: p.name, type: 'PROVINCE' }, update: { name: p.name } });
  }

  const effectiveFrom = new Date('2024-01-01');
  const jkHSD = [
    { code: 'L-PEKERJA', type: HSDType.LABOR, name: 'Pekerja', unit: 'OH', price: 120000 },
    { code: 'L-TUKANG-BATU', type: HSDType.LABOR, name: 'Tukang Batu', unit: 'OH', price: 145000 },
    { code: 'L-TUKANG-BESI', type: HSDType.LABOR, name: 'Tukang Besi/Pembesian', unit: 'OH', price: 145000 },
    { code: 'L-TUKANG-KAYU', type: HSDType.LABOR, name: 'Tukang Kayu', unit: 'OH', price: 145000 },
    { code: 'L-MANDOR', type: HSDType.LABOR, name: 'Mandor', unit: 'OH', price: 175000 },
    { code: 'L-KEPALA-TUKANG', type: HSDType.LABOR, name: 'Kepala Tukang', unit: 'OH', price: 158000 },
    { code: 'M-SEMEN-PC', type: HSDType.MATERIAL, name: 'Semen Portland (PC)', unit: 'kg', price: 2200 },
    { code: 'M-PASIR-BETON', type: HSDType.MATERIAL, name: 'Pasir Beton', unit: 'm³', price: 350000 },
    { code: 'M-KERIKIL', type: HSDType.MATERIAL, name: 'Kerikil / Split', unit: 'm³', price: 420000 },
    { code: 'M-PASIR-PASANG', type: HSDType.MATERIAL, name: 'Pasir Pasang', unit: 'm³', price: 280000 },
    { code: 'M-BATU-BATA', type: HSDType.MATERIAL, name: 'Batu Bata Merah', unit: 'bh', price: 850 },
    { code: 'M-BESI-BETON', type: HSDType.MATERIAL, name: 'Besi Beton Ulir', unit: 'kg', price: 14500 },
    { code: 'M-KAWAT-BETON', type: HSDType.MATERIAL, name: 'Kawat Beton', unit: 'kg', price: 25000 },
    { code: 'M-PAPAN-BEKISTING', type: HSDType.MATERIAL, name: 'Papan Kayu Bekisting', unit: 'm²', price: 85000 },
    { code: 'M-MULTIPLEX-12', type: HSDType.MATERIAL, name: 'Multiplex 12mm', unit: 'lbr', price: 165000 },
    { code: 'E-CONCRETE-MIXER', type: HSDType.EQUIPMENT, name: 'Concrete Mixer 0.3m³', unit: 'jam', price: 65000 },
    { code: 'E-VIBRATOR', type: HSDType.EQUIPMENT, name: 'Concrete Vibrator', unit: 'jam', price: 45000 },
    { code: 'E-SCAFFOLDING', type: HSDType.EQUIPMENT, name: 'Perancah / Scaffolding', unit: 'm²/bln', price: 35000 },
    { code: 'E-EXCAVATOR', type: HSDType.EQUIPMENT, name: 'Excavator PC 200', unit: 'jam', price: 850000 },
    { code: 'E-DUMP-TRUCK', type: HSDType.EQUIPMENT, name: 'Dump Truck 10T', unit: 'jam', price: 320000 },
  ];

  for (const h of jkHSD) {
    await prisma.hSDMaster.create({
      data: { tenantId: null, type: h.type, code: h.code, name: h.name, unit: h.unit, regionCode: 'ID-JK', price: h.price, effectiveFrom, source: 'SE_DJBK_68_2024_ILLUSTRATIVE' },
    }).catch(() => undefined);
  }

  console.log('  ✓ Regions + HSD Jakarta');
}

// ── System Roles ──────────────────────────────────────────────────────────────

async function seedSystemRoles() {
  const roles = [
    { code: 'OWNER', name: 'Owner / Pemilik Perusahaan' },
    { code: 'DIRECTOR', name: 'Direktur' },
    { code: 'PM', name: 'Project Manager' },
    { code: 'SITE_ENGINEER', name: 'Site Engineer' },
    { code: 'QS', name: 'Quantity Surveyor' },
    { code: 'PROCUREMENT', name: 'Procurement Officer' },
    { code: 'HSE', name: 'HSE Officer' },
    { code: 'QAQC', name: 'QA/QC Officer' },
    { code: 'FINANCE', name: 'Finance / Accounting' },
    { code: 'WORKER', name: 'Pekerja Lapangan' },
    { code: 'SUBCONTRACTOR', name: 'Subkontraktor (Eksternal)' },
    { code: 'ADMIN', name: 'Tenant Administrator' },
  ];

  for (const r of roles) {
    await prisma.role.upsert({
      where: { tenantId_code: { tenantId: null as any, code: r.code } } as any,
      create: { tenantId: null, code: r.code, name: r.name, isSystem: true },
      update: { name: r.name },
    });
  }

  console.log('  ✓ System roles');
}

// ── Demo Tenant (idempotent) ──────────────────────────────────────────────────

async function seedDemoTenant() {
  const existing = await prisma.tenant.findUnique({ where: { code: 'DEMO' } });
  if (existing) {
    console.log('  ↩ Demo tenant already exists, skipping');
    return;
  }

  // ─ Tenant ─
  const tenant = await prisma.tenant.create({
    data: { code: 'DEMO', name: 'PT Demo Konstruksi Indonesia', plan: 'PROFESSIONAL', isActive: true },
  });

  const company = await prisma.company.create({
    data: {
      tenantId: tenant.id, code: 'DEMO-CO', name: 'PT Demo Konstruksi Indonesia',
      npwp: '01.234.567.8-900.000',
      email: 'demo@example.com',
      createdBy: '00000000-0000-0000-0000-000000000001',
      updatedBy: '00000000-0000-0000-0000-000000000001',
    },
  });

  // ─ Users ─
  const pw = await bcrypt.hash('Demo@1234', 12);

  const admin = await prisma.user.create({
    data: { tenantId: tenant.id, email: 'admin@demo.com', passwordHash: pw, firstName: 'Admin', lastName: 'Demo', isActive: true },
  });
  const pm = await prisma.user.create({
    data: { tenantId: tenant.id, email: 'pm@demo.com', passwordHash: pw, firstName: 'Budi', lastName: 'Santoso', isActive: true },
  });
  const engineer = await prisma.user.create({
    data: { tenantId: tenant.id, email: 'engineer@demo.com', passwordHash: pw, firstName: 'Siti', lastName: 'Rahayu', isActive: true },
  });
  const worker = await prisma.user.create({
    data: { tenantId: tenant.id, email: 'worker@demo.com', passwordHash: pw, firstName: 'Agus', lastName: 'Wijaya', isActive: true },
  });
  const finance = await prisma.user.create({
    data: { tenantId: tenant.id, email: 'finance@demo.com', passwordHash: pw, firstName: 'Dewi', lastName: 'Kusuma', isActive: true },
  });

  // ─ Role Assignments ─
  const adminRole = await prisma.role.findFirst({ where: { code: 'ADMIN', isSystem: true } });
  const pmRole = await prisma.role.findFirst({ where: { code: 'PM', isSystem: true } });
  const engineerRole = await prisma.role.findFirst({ where: { code: 'SITE_ENGINEER', isSystem: true } });
  const workerRole = await prisma.role.findFirst({ where: { code: 'WORKER', isSystem: true } });
  const financeRole = await prisma.role.findFirst({ where: { code: 'FINANCE', isSystem: true } });

  if (adminRole) await prisma.roleAssignment.create({ data: { userId: admin.id, roleId: adminRole.id, assignedBy: admin.id } });
  if (pmRole) await prisma.roleAssignment.create({ data: { userId: pm.id, roleId: pmRole.id, assignedBy: admin.id } });
  if (engineerRole) await prisma.roleAssignment.create({ data: { userId: engineer.id, roleId: engineerRole.id, assignedBy: admin.id } });
  if (workerRole) await prisma.roleAssignment.create({ data: { userId: worker.id, roleId: workerRole.id, assignedBy: admin.id } });
  if (financeRole) await prisma.roleAssignment.create({ data: { userId: finance.id, roleId: financeRole.id, assignedBy: admin.id } });

  // ─ Projects ─
  const proj1 = await prisma.project.create({
    data: {
      tenantId: tenant.id, companyId: company.id,
      code: 'P0042', name: 'Gedung Kantor 10 Lantai – Jakarta Selatan',
      type: 'HIGH_RISE', status: ProjectStatus.ACTIVE,
      regionCode: 'ID-JK', contractValue: 95000000000, currency: 'IDR',
      startDate: new Date('2025-01-15'), endDate: new Date('2026-12-31'),
      wbsPrefix: 'P0042',
      createdBy: admin.id, updatedBy: admin.id,
    },
  });

  const proj2 = await prisma.project.create({
    data: {
      tenantId: tenant.id, companyId: company.id,
      code: 'P0043', name: 'Jalan Tol Seksi 3 – Jawa Barat',
      type: 'TOLL_ROAD', status: ProjectStatus.ACTIVE,
      regionCode: 'ID-JB', contractValue: 210000000000, currency: 'IDR',
      startDate: new Date('2025-03-01'), endDate: new Date('2027-06-30'),
      wbsPrefix: 'P0043',
      createdBy: admin.id, updatedBy: admin.id,
    },
  });

  // ─ WBS for P0042 ─
  const wbs1 = await prisma.wBSNode.create({
    data: { projectId: proj1.id, code: 'P0042-01', name: 'Pekerjaan Persiapan & Mobilisasi', level: 1, sortOrder: 1 },
  });
  const wbs2 = await prisma.wBSNode.create({
    data: { projectId: proj1.id, code: 'P0042-02', name: 'Pekerjaan Struktur', level: 1, sortOrder: 2 },
  });
  const wbs3 = await prisma.wBSNode.create({
    data: { projectId: proj1.id, code: 'P0042-03', name: 'Pekerjaan Arsitektur', level: 1, sortOrder: 3 },
  });
  const wbs2a = await prisma.wBSNode.create({
    data: { projectId: proj1.id, parentId: wbs2.id, code: 'P0042-02.01', name: 'Pondasi', level: 2, sortOrder: 1 },
  });
  const wbs2b = await prisma.wBSNode.create({
    data: { projectId: proj1.id, parentId: wbs2.id, code: 'P0042-02.02', name: 'Kolom & Balok', level: 2, sortOrder: 2 },
  });
  const wbs2c = await prisma.wBSNode.create({
    data: { projectId: proj1.id, parentId: wbs2.id, code: 'P0042-02.03', name: 'Pelat Lantai', level: 2, sortOrder: 3 },
  });

  // ─ Budget Version + RAB Lines ─
  const budgetV1 = await prisma.budgetVersion.create({
    data: {
      tenantId: tenant.id, projectId: proj1.id,
      version: 1, name: 'Penawaran Awal Rev-0',
      description: 'Versi awal untuk tender',
      isBaseline: true, isLocked: true,
      lockedAt: new Date(), lockedBy: admin.id,
      totalRAB: 87500000000, totalRAP: 73500000000,
      margin: 14000000000, marginPct: 16.0,
      createdBy: admin.id, updatedBy: admin.id,
    },
  });

  const rabLines = [
    { wbsNodeId: wbs1.id, itemCode: '01.001', description: 'Mobilisasi & Demobilisasi', unit: 'ls', quantity: 1, hspJual: 850000000, hspBiaya: 680000000 },
    { wbsNodeId: wbs2a.id, itemCode: '02.001', description: 'Galian Tanah Biasa Kedalaman 2m', unit: 'm³', quantity: 2400, hspJual: 185000, hspBiaya: 152000 },
    { wbsNodeId: wbs2a.id, itemCode: '02.002', description: '1 m³ Beton K-300 Pondasi', unit: 'm³', quantity: 850, hspJual: 1850000, hspBiaya: 1520000 },
    { wbsNodeId: wbs2a.id, itemCode: '02.003', description: 'Pembesian Pondasi (Besi D16)', unit: 'kg', quantity: 145000, hspJual: 28500, hspBiaya: 23200 },
    { wbsNodeId: wbs2b.id, itemCode: '02.004', description: '1 m³ Beton K-350 Kolom', unit: 'm³', quantity: 1200, hspJual: 2150000, hspBiaya: 1750000 },
    { wbsNodeId: wbs2b.id, itemCode: '02.005', description: '1 m³ Beton K-350 Balok', unit: 'm³', quantity: 980, hspJual: 2050000, hspBiaya: 1680000 },
    { wbsNodeId: wbs2c.id, itemCode: '02.006', description: '1 m² Pelat Beton t=15cm (K-300)', unit: 'm²', quantity: 8500, hspJual: 620000, hspBiaya: 510000 },
    { wbsNodeId: wbs3.id, itemCode: '03.001', description: '1 m² Pasangan Bata Merah ½ bata', unit: 'm²', quantity: 12400, hspJual: 185000, hspBiaya: 150000 },
    { wbsNodeId: wbs3.id, itemCode: '03.002', description: '1 m² Plesteran + Acian', unit: 'm²', quantity: 24800, hspJual: 95000, hspBiaya: 77000 },
  ];

  for (const l of rabLines) {
    await prisma.rABLine.create({
      data: {
        budgetVersionId: budgetV1.id,
        wbsNodeId: l.wbsNodeId,
        itemCode: l.itemCode,
        description: l.description,
        unit: l.unit,
        quantity: l.quantity,
        hspJual: l.hspJual,
        rabAmount: l.quantity * l.hspJual,
        hspBiaya: l.hspBiaya,
        rapAmount: l.quantity * l.hspBiaya,
        createdBy: admin.id,
        updatedBy: admin.id,
      },
    });
  }

  // ─ Jobs ─
  await prisma.job.create({
    data: {
      tenantId: tenant.id, projectId: proj1.id, wbsNodeId: wbs2a.id,
      jobNo: 'P0042-JOB-001',
      title: 'Galian Tanah Pondasi Blok A',
      description: 'Galian tanah biasa untuk pondasi setempat blok A lt. basement',
      type: JobType.FIELD_TASK,
      status: JobStatus.IN_PROGRESS,
      plannedStart: new Date('2025-02-01'), dueDate: new Date('2025-03-15'),
      progressPercent: 65,
      createdBy: admin.id, updatedBy: admin.id,
    },
  });

  await prisma.job.create({
    data: {
      tenantId: tenant.id, projectId: proj1.id, wbsNodeId: wbs2a.id,
      jobNo: 'P0042-JOB-002',
      title: 'Pembesian Pondasi P1–P20',
      description: 'Fabrikasi dan pemasangan besi pondasi setempat P1 s/d P20',
      type: JobType.FIELD_TASK,
      status: JobStatus.ASSIGNED,
      plannedStart: new Date('2025-03-01'), dueDate: new Date('2025-04-30'),
      progressPercent: 0,
      assigneeType: AssigneeType.USER, assigneeId: engineer.id, assigneeName: `${engineer.firstName} ${engineer.lastName}`,
      createdBy: admin.id, updatedBy: admin.id,
    },
  });

  await prisma.job.create({
    data: {
      tenantId: tenant.id, projectId: proj1.id, wbsNodeId: wbs2b.id,
      jobNo: 'P0042-JOB-003',
      title: 'Pengecoran Kolom Lt. 1 Grid A–D',
      description: 'Pengecoran beton K-350 kolom lantai 1 grid A hingga D',
      type: JobType.FIELD_TASK,
      status: JobStatus.OPEN,
      plannedStart: new Date('2025-05-01'), dueDate: new Date('2025-06-30'),
      progressPercent: 0,
      createdBy: admin.id, updatedBy: admin.id,
    },
  });

  // ─ AHSP Library ─
  const effectiveFrom = new Date('2024-01-01');
  const regulationVersion = 'SE_DJBK_68_2024';
  const legalBasis = 'SE DJBK No. 68/2024';

  // AHSP 1: Beton K-250
  const beton250 = await prisma.aHSPItem.create({
    data: {
      tenantId: null, code: 'B.01.001', name: '1 m³ Beton K-250 cor manual',
      unit: 'm³', category: 'BETON', discipline: 'CIVIL',
      regulationBasis: RegulationBasis.SE_DJBK_68_2024,
      overheadPct: 10, profitPct: 5,
    },
  });

  const beton250Comps = [
    { type: ComponentType.LABOR, code: 'L-PEKERJA', desc: 'Pekerja', unit: 'OH', coef: 1.6500 },
    { type: ComponentType.LABOR, code: 'L-TUKANG-BATU', desc: 'Tukang Batu', unit: 'OH', coef: 0.2750 },
    { type: ComponentType.LABOR, code: 'L-MANDOR', desc: 'Mandor', unit: 'OH', coef: 0.0830 },
    { type: ComponentType.MATERIAL, code: 'M-SEMEN-PC', desc: 'Semen Portland', unit: 'kg', coef: 384.0 },
    { type: ComponentType.MATERIAL, code: 'M-PASIR-BETON', desc: 'Pasir Beton', unit: 'm³', coef: 0.4810 },
    { type: ComponentType.MATERIAL, code: 'M-KERIKIL', desc: 'Kerikil/Split', unit: 'm³', coef: 0.6080 },
    { type: ComponentType.EQUIPMENT, code: 'E-CONCRETE-MIXER', desc: 'Concrete Mixer', unit: 'jam', coef: 0.2500 },
    { type: ComponentType.EQUIPMENT, code: 'E-VIBRATOR', desc: 'Concrete Vibrator', unit: 'jam', coef: 0.2500 },
  ];

  for (let i = 0; i < beton250Comps.length; i++) {
    const c = beton250Comps[i];
    const comp = await prisma.aHSPComponent.create({
      data: { ahspItemId: beton250.id, type: c.type, hsdCode: c.code, description: c.desc, unit: c.unit, sortOrder: i },
    });
    await prisma.aHSPCoefficient.create({
      data: { componentId: comp.id, coefficient: c.coef, regulationVersion, effectiveFrom, legalBasis },
    });
  }

  // AHSP 2: Pasangan Bata Merah
  const bata = await prisma.aHSPItem.create({
    data: {
      tenantId: null, code: 'P.01.001', name: '1 m² Pasangan Bata Merah ½ bata adukan 1:5',
      unit: 'm²', category: 'PASANGAN', discipline: 'CIVIL',
      regulationBasis: RegulationBasis.SE_DJBK_68_2024, overheadPct: 10, profitPct: 5,
    },
  });

  const bataComps = [
    { type: ComponentType.LABOR, code: 'L-PEKERJA', desc: 'Pekerja', unit: 'OH', coef: 0.3000 },
    { type: ComponentType.LABOR, code: 'L-TUKANG-BATU', desc: 'Tukang Batu', unit: 'OH', coef: 0.1000 },
    { type: ComponentType.LABOR, code: 'L-MANDOR', desc: 'Mandor', unit: 'OH', coef: 0.0150 },
    { type: ComponentType.MATERIAL, code: 'M-BATU-BATA', desc: 'Batu Bata Merah', unit: 'bh', coef: 70.0 },
    { type: ComponentType.MATERIAL, code: 'M-SEMEN-PC', desc: 'Semen Portland', unit: 'kg', coef: 9.68 },
    { type: ComponentType.MATERIAL, code: 'M-PASIR-PASANG', desc: 'Pasir Pasang', unit: 'm³', coef: 0.0450 },
  ];

  for (let i = 0; i < bataComps.length; i++) {
    const c = bataComps[i];
    const comp = await prisma.aHSPComponent.create({
      data: { ahspItemId: bata.id, type: c.type, hsdCode: c.code, description: c.desc, unit: c.unit, sortOrder: i },
    });
    await prisma.aHSPCoefficient.create({
      data: { componentId: comp.id, coefficient: c.coef, regulationVersion, effectiveFrom, legalBasis },
    });
  }

  // AHSP 3: Galian Tanah
  const galian = await prisma.aHSPItem.create({
    data: {
      tenantId: null, code: 'T.01.001', name: '1 m³ Galian Tanah Biasa Kedalaman ≤2m',
      unit: 'm³', category: 'TANAH', discipline: 'CIVIL',
      regulationBasis: RegulationBasis.SE_DJBK_68_2024, overheadPct: 10, profitPct: 5,
    },
  });

  const galianComps = [
    { type: ComponentType.LABOR, code: 'L-PEKERJA', desc: 'Pekerja', unit: 'OH', coef: 0.7500 },
    { type: ComponentType.LABOR, code: 'L-MANDOR', desc: 'Mandor', unit: 'OH', coef: 0.0250 },
    { type: ComponentType.EQUIPMENT, code: 'E-EXCAVATOR', desc: 'Excavator PC 200', unit: 'jam', coef: 0.0500 },
  ];

  for (let i = 0; i < galianComps.length; i++) {
    const c = galianComps[i];
    const comp = await prisma.aHSPComponent.create({
      data: { ahspItemId: galian.id, type: c.type, hsdCode: c.code, description: c.desc, unit: c.unit, sortOrder: i },
    });
    await prisma.aHSPCoefficient.create({
      data: { componentId: comp.id, coefficient: c.coef, regulationVersion, effectiveFrom, legalBasis },
    });
  }

  // ─ S-Curve Snapshots (6 months) ─
  const snapshots = [
    { date: '2025-01-31', planned: 2.5, actual: 2.3 },
    { date: '2025-02-28', planned: 6.0, actual: 5.8 },
    { date: '2025-03-31', planned: 11.5, actual: 10.9 },
    { date: '2025-04-30', planned: 18.0, actual: 17.2 },
    { date: '2025-05-31', planned: 26.5, actual: 24.8 },
    { date: '2025-06-30', planned: 35.0, actual: 33.1 },
  ];

  for (const s of snapshots) {
    const pv = (s.planned / 100) * 95000000000;
    const ev = (s.actual / 100) * 95000000000;
    const ac = ev * 0.97;
    await prisma.progressSnapshot.create({
      data: {
        tenantId: tenant.id, projectId: proj1.id,
        snapshotDate: new Date(s.date),
        plannedPct: s.planned, actualPct: s.actual,
        plannedValue: pv, earnedValue: ev, actualCost: ac,
        createdBy: admin.id,
      },
    }).catch(() => undefined);
  }

  // ─ Daily Log ─
  await prisma.dailyLog.create({
    data: {
      tenantId: tenant.id, projectId: proj1.id,
      logDate: new Date('2025-06-09'),
      weather: 'Cerah berawan, 32°C',
      manpowerCount: 48,
      workSummary: 'Galian tanah zona A selesai 80%. Penulangan pondasi P1–P8 selesai 100%. Cor pondasi P1–P4 sedang proses.',
      issues: 'Keterlambatan pengiriman besi beton D16 dari supplier.',
      preparedBy: admin.id,
    },
  });

  // ─ NCR ─
  await prisma.nCR.create({
    data: {
      tenantId: tenant.id, projectId: proj1.id, wbsNodeId: wbs2a.id,
      ncrNo: 'NCR-P0042-202506-001',
      title: 'Mutu beton tidak sesuai — sampel gagal uji',
      description: 'Sampel beton pengecoran kolom C1–C3 tanggal 5 Juni menunjukkan kuat tekan 28 hari hanya 285 kg/cm² (spesifikasi min 350 kg/cm²)',
      category: 'MATERIAL', severity: 'MAJOR',
      discipline: 'CIVIL',
      raisedBy: admin.id,
    },
  });

  // ─ Equipment ─
  const excavator = await prisma.equipment.create({
    data: {
      tenantId: tenant.id, code: 'EQ-001', name: 'Excavator Komatsu PC200',
      category: 'EXCAVATOR', brand: 'Komatsu', model: 'PC200-8M0',
      serialNo: 'KMT-2024-001', status: 'ACTIVE',
      dailyRate: 6500000, hourlyRate: 850000,
      createdBy: admin.id,
    },
  });

  await prisma.equipmentDeployment.create({
    data: {
      equipmentId: excavator.id, projectId: proj1.id,
      deployedAt: new Date('2025-01-20'),
      location: 'Zona Galian Basement Blok A',
      operatorName: 'Hendra Saputra',
      deployedBy: admin.id,
    },
  });

  console.log('  ✓ Demo tenant: 5 users, 2 projects, WBS, RAB lines, 3 AHSP, 6 S-Curve snapshots, NCR, Equipment, Jobs');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
