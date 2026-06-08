import { PrismaClient, TaxType, HSDType, RegulationBasis, ComponentType } from '@prisma/client';
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

// ── Tax Rates (PP 9/2022) — effective 21 Feb 2022 ──────────────────────────

async function seedTaxRates() {
  const effectiveFrom = new Date('2022-02-21');
  const legalBasis = 'PP 9/2022 jo. PP 51/2008';

  const rates = [
    {
      code: 'JK-01',
      taxType: TaxType.PPH_FINAL_CONSTRUCTION,
      description: 'PPh Final – Pekerjaan Konstruksi',
      qualification: 'SBU Kecil / SKK perseorangan',
      rate: 0.0175,
    },
    {
      code: 'JK-02',
      taxType: TaxType.PPH_FINAL_CONSTRUCTION,
      description: 'PPh Final – Pekerjaan Konstruksi',
      qualification: 'Menengah / Besar / Spesialis (bersertifikat)',
      rate: 0.0265,
    },
    {
      code: 'JK-03',
      taxType: TaxType.PPH_FINAL_CONSTRUCTION,
      description: 'PPh Final – Pekerjaan Konstruksi',
      qualification: 'Tanpa SBU / SKK',
      rate: 0.04,
    },
    {
      code: 'JK-04',
      taxType: TaxType.PPH_FINAL_CONSTRUCTION,
      description: 'PPh Final – Konstruksi Terintegrasi (EPC)',
      qualification: 'Memiliki SBU',
      rate: 0.0265,
    },
    {
      code: 'JK-05',
      taxType: TaxType.PPH_FINAL_CONSTRUCTION,
      description: 'PPh Final – Konstruksi Terintegrasi (EPC)',
      qualification: 'Tanpa SBU',
      rate: 0.04,
    },
    {
      code: 'JK-06',
      taxType: TaxType.PPH_FINAL_CONSTRUCTION,
      description: 'PPh Final – Konsultansi Konstruksi',
      qualification: 'Memiliki SBU / SKK',
      rate: 0.035,
    },
    {
      code: 'JK-07',
      taxType: TaxType.PPH_FINAL_CONSTRUCTION,
      description: 'PPh Final – Konsultansi Konstruksi',
      qualification: 'Tanpa SBU / SKK',
      rate: 0.06,
    },
    {
      code: 'PPN',
      taxType: TaxType.PPN,
      description: 'Pajak Pertambahan Nilai',
      qualification: null,
      rate: 0.11,
    },
  ];

  for (const r of rates) {
    await prisma.taxRate.upsert({
      where: { id: r.code } as any,
      create: {
        code: r.code,
        taxType: r.taxType,
        description: r.description,
        qualification: r.qualification,
        rate: r.rate,
        effectiveFrom,
        legalBasis,
        isActive: true,
      },
      update: { rate: r.rate, isActive: true },
    });
  }

  // Pre-seed PPN 12% route (not yet effective — effectiveTo left null when activated)
  await prisma.taxRate.upsert({
    where: { id: 'PPN-12' } as any,
    create: {
      code: 'PPN-12',
      taxType: TaxType.PPN,
      description: 'Pajak Pertambahan Nilai (rencana 12%)',
      qualification: null,
      rate: 0.12,
      effectiveFrom: new Date('2999-01-01'),
      legalBasis: 'UU 7/2021 HPP (belum berlaku)',
      isActive: false,
    },
    update: {},
  });

  console.log('  ✓ Tax rates (PP 9/2022 + PPN)');
}

// ── Indonesia Provinces (sample set) ───────────────────────────────────────

async function seedRegions() {
  const provinces = [
    { code: 'ID-AC', name: 'Aceh' },
    { code: 'ID-SU', name: 'Sumatera Utara' },
    { code: 'ID-SB', name: 'Sumatera Barat' },
    { code: 'ID-RI', name: 'Riau' },
    { code: 'ID-JA', name: 'Jambi' },
    { code: 'ID-SS', name: 'Sumatera Selatan' },
    { code: 'ID-BG', name: 'Bengkulu' },
    { code: 'ID-LA', name: 'Lampung' },
    { code: 'ID-BB', name: 'Kepulauan Bangka Belitung' },
    { code: 'ID-KR', name: 'Kepulauan Riau' },
    { code: 'ID-JK', name: 'DKI Jakarta' },
    { code: 'ID-JB', name: 'Jawa Barat' },
    { code: 'ID-JT', name: 'Jawa Tengah' },
    { code: 'ID-YO', name: 'DI Yogyakarta' },
    { code: 'ID-JI', name: 'Jawa Timur' },
    { code: 'ID-BT', name: 'Banten' },
    { code: 'ID-BA', name: 'Bali' },
    { code: 'ID-NB', name: 'Nusa Tenggara Barat' },
    { code: 'ID-NT', name: 'Nusa Tenggara Timur' },
    { code: 'ID-KB', name: 'Kalimantan Barat' },
    { code: 'ID-KT', name: 'Kalimantan Tengah' },
    { code: 'ID-KS', name: 'Kalimantan Selatan' },
    { code: 'ID-KI', name: 'Kalimantan Timur' },
    { code: 'ID-KU', name: 'Kalimantan Utara' },
    { code: 'ID-SA', name: 'Sulawesi Utara' },
    { code: 'ID-ST', name: 'Sulawesi Tengah' },
    { code: 'ID-SG', name: 'Sulawesi Selatan' },
    { code: 'ID-SN', name: 'Sulawesi Tenggara' },
    { code: 'ID-GO', name: 'Gorontalo' },
    { code: 'ID-SR', name: 'Sulawesi Barat' },
    { code: 'ID-MA', name: 'Maluku' },
    { code: 'ID-MU', name: 'Maluku Utara' },
    { code: 'ID-PA', name: 'Papua' },
    { code: 'ID-PB', name: 'Papua Barat' },
    { code: 'ID-PE', name: 'Papua Pegunungan' },
    { code: 'ID-PS', name: 'Papua Selatan' },
    { code: 'ID-PT', name: 'Papua Tengah' },
    { code: 'ID-SW', name: 'Papua Barat Daya' },
  ];

  for (const p of provinces) {
    await prisma.region.upsert({
      where: { code: p.code },
      create: { code: p.code, name: p.name, type: 'PROVINCE' },
      update: { name: p.name },
    });
  }

  // Sample HSD prices for DKI Jakarta (illustrative, per SE DJBK 68/2024 basis)
  const effectiveFrom = new Date('2024-01-01');
  const jkHSD = [
    // LABOR
    { code: 'L-PEKERJA', type: HSDType.LABOR, name: 'Pekerja', unit: 'OH', price: 120000 },
    { code: 'L-TUKANG-BATU', type: HSDType.LABOR, name: 'Tukang Batu', unit: 'OH', price: 145000 },
    { code: 'L-TUKANG-BESI', type: HSDType.LABOR, name: 'Tukang Besi/Pembesian', unit: 'OH', price: 145000 },
    { code: 'L-TUKANG-KAYU', type: HSDType.LABOR, name: 'Tukang Kayu', unit: 'OH', price: 145000 },
    { code: 'L-MANDOR', type: HSDType.LABOR, name: 'Mandor', unit: 'OH', price: 175000 },
    { code: 'L-KEPALA-TUKANG', type: HSDType.LABOR, name: 'Kepala Tukang', unit: 'OH', price: 158000 },
    // MATERIAL
    { code: 'M-SEMEN-PC', type: HSDType.MATERIAL, name: 'Semen Portland (PC)', unit: 'kg', price: 2200 },
    { code: 'M-PASIR-BETON', type: HSDType.MATERIAL, name: 'Pasir Beton', unit: 'm³', price: 350000 },
    { code: 'M-KERIKIL', type: HSDType.MATERIAL, name: 'Kerikil / Split', unit: 'm³', price: 420000 },
    { code: 'M-PASIR-PASANG', type: HSDType.MATERIAL, name: 'Pasir Pasang', unit: 'm³', price: 280000 },
    { code: 'M-BATU-BATA', type: HSDType.MATERIAL, name: 'Batu Bata Merah', unit: 'bh', price: 850 },
    { code: 'M-BESI-BETON', type: HSDType.MATERIAL, name: 'Besi Beton Ulir', unit: 'kg', price: 14500 },
    { code: 'M-KAWAT-BETON', type: HSDType.MATERIAL, name: 'Kawat Beton', unit: 'kg', price: 25000 },
    { code: 'M-PAPAN-BEKISTING', type: HSDType.MATERIAL, name: 'Papan Kayu Bekisting', unit: 'm²', price: 85000 },
    { code: 'M-MULTIPLEX-12', type: HSDType.MATERIAL, name: 'Multiplex 12mm', unit: 'lbr', price: 165000 },
    // EQUIPMENT
    { code: 'E-CONCRETE-MIXER', type: HSDType.EQUIPMENT, name: 'Concrete Mixer 0.3m³', unit: 'jam', price: 65000 },
    { code: 'E-VIBRATOR', type: HSDType.EQUIPMENT, name: 'Concrete Vibrator', unit: 'jam', price: 45000 },
    { code: 'E-SCAFFOLDING', type: HSDType.EQUIPMENT, name: 'Perancah / Scaffolding', unit: 'm²/bln', price: 35000 },
    { code: 'E-EXCAVATOR', type: HSDType.EQUIPMENT, name: 'Excavator PC 200', unit: 'jam', price: 850000 },
    { code: 'E-DUMP-TRUCK', type: HSDType.EQUIPMENT, name: 'Dump Truck 10T', unit: 'jam', price: 320000 },
  ];

  for (const h of jkHSD) {
    await prisma.hSDMaster.create({
      data: {
        tenantId: null,
        type: h.type,
        code: h.code,
        name: h.name,
        unit: h.unit,
        regionCode: 'ID-JK',
        price: h.price,
        effectiveFrom,
        source: 'SE_DJBK_68_2024_ILLUSTRATIVE',
      },
    }).catch(() => undefined);
  }

  console.log('  ✓ Regions (34 provinces) + HSD Jakarta sample');
}

// ── System Roles ────────────────────────────────────────────────────────────

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

// ── Demo Tenant with sample AHSP library ────────────────────────────────────

async function seedDemoTenant() {
  const existing = await prisma.tenant.findUnique({ where: { code: 'DEMO' } });
  if (existing) {
    console.log('  ↩ Demo tenant already exists, skipping');
    return;
  }

  const tenant = await prisma.tenant.create({
    data: {
      code: 'DEMO',
      name: 'PT Demo Konstruksi Indonesia',
      plan: 'PROFESSIONAL',
      isActive: true,
    },
  });

  const company = await prisma.company.create({
    data: {
      tenantId: tenant.id,
      code: 'DEMO-CO',
      name: 'PT Demo Konstruksi Indonesia',
      email: 'demo@example.com',
      createdBy: '00000000-0000-0000-0000-000000000001',
      updatedBy: '00000000-0000-0000-0000-000000000001',
    },
  });

  const passwordHash = await bcrypt.hash('Demo@1234', 12);

  await prisma.user.create({
    data: {
      tenantId: tenant.id,
      email: 'admin@demo.com',
      passwordHash,
      firstName: 'Admin',
      lastName: 'Demo',
      isActive: true,
    },
  });

  // Sample AHSP: 1 m³ Beton K-250 cor manual (SE DJBK 68/2024 / PUPR 1/2022)
  const betonItem = await prisma.aHSPItem.create({
    data: {
      tenantId: null,
      code: 'B.01.001',
      name: '1 m³ Beton K-250 cor manual',
      unit: 'm³',
      category: 'BETON',
      discipline: 'CIVIL',
      regulationBasis: RegulationBasis.SE_DJBK_68_2024,
      overheadPct: 10,
      profitPct: 5,
      notes: 'Koefisien ilustratif — pustaka final dari SE DJBK 68/2024',
    },
  });

  const effectiveFrom = new Date('2024-01-01');
  const regulationVersion = 'SE_DJBK_68_2024';
  const legalBasis = 'SE DJBK No. 68/2024';

  // Labor components
  const laborComponents = [
    { hsdCode: 'L-PEKERJA', description: 'Pekerja', unit: 'OH', coefficient: 1.6500 },
    { hsdCode: 'L-TUKANG-BATU', description: 'Tukang Batu', unit: 'OH', coefficient: 0.2750 },
    { hsdCode: 'L-MANDOR', description: 'Mandor', unit: 'OH', coefficient: 0.0830 },
  ];

  const materialComponents = [
    { hsdCode: 'M-SEMEN-PC', description: 'Semen Portland (PC)', unit: 'kg', coefficient: 384.0000 },
    { hsdCode: 'M-PASIR-BETON', description: 'Pasir Beton', unit: 'm³', coefficient: 0.4810 },
    { hsdCode: 'M-KERIKIL', description: 'Kerikil / Split', unit: 'm³', coefficient: 0.6080 },
  ];

  const equipmentComponents = [
    { hsdCode: 'E-CONCRETE-MIXER', description: 'Concrete Mixer', unit: 'jam', coefficient: 0.2500 },
    { hsdCode: 'E-VIBRATOR', description: 'Concrete Vibrator', unit: 'jam', coefficient: 0.2500 },
  ];

  let sortOrder = 0;
  for (const comp of [...laborComponents, ...materialComponents, ...equipmentComponents]) {
    const type =
      laborComponents.includes(comp as any)
        ? ComponentType.LABOR
        : materialComponents.includes(comp as any)
          ? ComponentType.MATERIAL
          : ComponentType.EQUIPMENT;

    const component = await prisma.aHSPComponent.create({
      data: {
        ahspItemId: betonItem.id,
        type,
        hsdCode: comp.hsdCode,
        description: comp.description,
        unit: comp.unit,
        sortOrder: sortOrder++,
      },
    });

    await prisma.aHSPCoefficient.create({
      data: {
        componentId: component.id,
        coefficient: comp.coefficient,
        regulationVersion,
        effectiveFrom,
        legalBasis,
      },
    });
  }

  // Sample AHSP: Pasangan Bata Merah
  const bataItem = await prisma.aHSPItem.create({
    data: {
      tenantId: null,
      code: 'P.01.001',
      name: '1 m² Pasangan Bata Merah tebal ½ bata, adukan 1:5',
      unit: 'm²',
      category: 'PASANGAN',
      discipline: 'CIVIL',
      regulationBasis: RegulationBasis.SE_DJBK_68_2024,
      overheadPct: 10,
      profitPct: 5,
    },
  });

  const bataComponents = [
    { type: ComponentType.LABOR, hsdCode: 'L-PEKERJA', description: 'Pekerja', unit: 'OH', coefficient: 0.3000 },
    { type: ComponentType.LABOR, hsdCode: 'L-TUKANG-BATU', description: 'Tukang Batu', unit: 'OH', coefficient: 0.1000 },
    { type: ComponentType.LABOR, hsdCode: 'L-MANDOR', description: 'Mandor', unit: 'OH', coefficient: 0.0150 },
    { type: ComponentType.MATERIAL, hsdCode: 'M-BATU-BATA', description: 'Batu Bata Merah', unit: 'bh', coefficient: 70.0000 },
    { type: ComponentType.MATERIAL, hsdCode: 'M-SEMEN-PC', description: 'Semen Portland', unit: 'kg', coefficient: 9.6800 },
    { type: ComponentType.MATERIAL, hsdCode: 'M-PASIR-PASANG', description: 'Pasir Pasang', unit: 'm³', coefficient: 0.0450 },
  ];

  sortOrder = 0;
  for (const comp of bataComponents) {
    const component = await prisma.aHSPComponent.create({
      data: {
        ahspItemId: bataItem.id,
        type: comp.type,
        hsdCode: comp.hsdCode,
        description: comp.description,
        unit: comp.unit,
        sortOrder: sortOrder++,
      },
    });

    await prisma.aHSPCoefficient.create({
      data: {
        componentId: component.id,
        coefficient: comp.coefficient,
        regulationVersion,
        effectiveFrom,
        legalBasis,
      },
    });
  }

  // Demo project
  await prisma.project.create({
    data: {
      tenantId: tenant.id,
      companyId: company.id,
      code: 'P0042',
      name: 'Gedung Kantor 10 Lantai – Jakarta Selatan',
      type: 'HIGH_RISE',
      status: 'ACTIVE',
      regionCode: 'ID-JK',
      contractValue: 95000000000,
      currency: 'IDR',
      wbsPrefix: 'P0042',
      createdBy: '00000000-0000-0000-0000-000000000001',
      updatedBy: '00000000-0000-0000-0000-000000000001',
    },
  });

  console.log('  ✓ Demo tenant + company + admin user + AHSP library (2 items) + project');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
