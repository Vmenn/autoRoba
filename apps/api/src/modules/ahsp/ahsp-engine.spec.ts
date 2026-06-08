import { Test, TestingModule } from '@nestjs/testing';
import Decimal from 'decimal.js';
import { AHSPEngineService } from './ahsp-engine.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('AHSPEngineService', () => {
  let engine: AHSPEngineService;

  const mockItem = {
    id: 'item-uuid',
    code: 'B.01.001',
    name: '1 m³ Beton K-250 cor manual',
    unit: 'm³',
    regulationBasis: 'SE_DJBK_68_2024',
    overheadPct: new Decimal('10.00'),
    profitPct: new Decimal('5.00'),
    components: [
      // Labor
      {
        id: 'c1', type: 'LABOR', hsdCode: 'L-PEKERJA', description: 'Pekerja', unit: 'OH', sortOrder: 0,
        coefficients: [{ id: 'coef1', coefficient: new Decimal('1.6500'), regulationVersion: 'SE_DJBK_68_2024', effectiveFrom: new Date('2024-01-01'), effectiveTo: null }],
      },
      {
        id: 'c2', type: 'LABOR', hsdCode: 'L-TUKANG-BATU', description: 'Tukang Batu', unit: 'OH', sortOrder: 1,
        coefficients: [{ id: 'coef2', coefficient: new Decimal('0.2750'), regulationVersion: 'SE_DJBK_68_2024', effectiveFrom: new Date('2024-01-01'), effectiveTo: null }],
      },
      {
        id: 'c3', type: 'LABOR', hsdCode: 'L-MANDOR', description: 'Mandor', unit: 'OH', sortOrder: 2,
        coefficients: [{ id: 'coef3', coefficient: new Decimal('0.0830'), regulationVersion: 'SE_DJBK_68_2024', effectiveFrom: new Date('2024-01-01'), effectiveTo: null }],
      },
      // Material
      {
        id: 'c4', type: 'MATERIAL', hsdCode: 'M-SEMEN-PC', description: 'Semen PC', unit: 'kg', sortOrder: 3,
        coefficients: [{ id: 'coef4', coefficient: new Decimal('384.0000'), regulationVersion: 'SE_DJBK_68_2024', effectiveFrom: new Date('2024-01-01'), effectiveTo: null }],
      },
      {
        id: 'c5', type: 'MATERIAL', hsdCode: 'M-PASIR-BETON', description: 'Pasir Beton', unit: 'm³', sortOrder: 4,
        coefficients: [{ id: 'coef5', coefficient: new Decimal('0.4810'), regulationVersion: 'SE_DJBK_68_2024', effectiveFrom: new Date('2024-01-01'), effectiveTo: null }],
      },
      {
        id: 'c6', type: 'MATERIAL', hsdCode: 'M-KERIKIL', description: 'Kerikil', unit: 'm³', sortOrder: 5,
        coefficients: [{ id: 'coef6', coefficient: new Decimal('0.6080'), regulationVersion: 'SE_DJBK_68_2024', effectiveFrom: new Date('2024-01-01'), effectiveTo: null }],
      },
      // Equipment
      {
        id: 'c7', type: 'EQUIPMENT', hsdCode: 'E-CONCRETE-MIXER', description: 'Concrete Mixer', unit: 'jam', sortOrder: 6,
        coefficients: [{ id: 'coef7', coefficient: new Decimal('0.2500'), regulationVersion: 'SE_DJBK_68_2024', effectiveFrom: new Date('2024-01-01'), effectiveTo: null }],
      },
    ],
  };

  // HSD prices (DKI Jakarta, illustrative)
  const hsdPrices: Record<string, number> = {
    'L-PEKERJA': 120000,
    'L-TUKANG-BATU': 145000,
    'L-MANDOR': 175000,
    'M-SEMEN-PC': 2200,
    'M-PASIR-BETON': 350000,
    'M-KERIKIL': 420000,
    'E-CONCRETE-MIXER': 65000,
  };

  const mockPrisma = {
    aHSPItem: { findUnique: jest.fn().mockResolvedValue(mockItem) },
    hSDMaster: {
      findFirst: jest.fn().mockImplementation(({ where }) => {
        const price = hsdPrices[where.code];
        if (!price) return null;
        return Promise.resolve({ price: new Decimal(price) });
      }),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AHSPEngineService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    engine = module.get<AHSPEngineService>(AHSPEngineService);
  });

  it('calculates labor, material, equipment totals correctly', async () => {
    const result = await engine.calculate({
      ahspItemId: 'item-uuid',
      regionCode: 'ID-JK',
      calculationDate: '2026-06-01',
    });

    // Labor:
    // Pekerja: 1.6500 × 120000 = 198,000
    // Tukang Batu: 0.2750 × 145000 = 39,875
    // Mandor: 0.0830 × 175000 = 14,525
    // Total labor = 252,400
    expect(result.laborTotal).toBe('252400.00');

    // Material:
    // Semen PC: 384 × 2200 = 844,800
    // Pasir Beton: 0.481 × 350000 = 168,350
    // Kerikil: 0.608 × 420000 = 255,360
    // Total material = 1,268,510
    expect(result.materialTotal).toBe('1268510.00');

    // Equipment:
    // Concrete Mixer: 0.25 × 65000 = 16,250
    expect(result.equipmentTotal).toBe('16250.00');

    // Direct Cost = 252,400 + 1,268,510 + 16,250 = 1,537,160
    expect(result.directCost).toBe('1537160.00');

    // Overhead (10%) = 153,716
    expect(result.overheadAmount).toBe('153716.00');

    // Profit (5%) = 76,858
    expect(result.profitAmount).toBe('76858.00');

    // HSP final = 1,537,160 + 153,716 + 76,858 = 1,767,734
    expect(result.hspWithOverheadProfit).toBe('1767734.00');
  });

  it('respects override overhead and profit percentages', async () => {
    const result = await engine.calculate({
      ahspItemId: 'item-uuid',
      regionCode: 'ID-JK',
      overheadPct: 15,
      profitPct: 10,
    });

    const directCost = new Decimal('1537160.00');
    const overhead = directCost.times(15).div(100).toDecimalPlaces(2);
    const profit = directCost.times(10).div(100).toDecimalPlaces(2);
    const hsp = directCost.plus(overhead).plus(profit);

    expect(result.overheadAmount).toBe(overhead.toFixed(2));
    expect(result.profitAmount).toBe(profit.toFixed(2));
    expect(result.hspWithOverheadProfit).toBe(hsp.toFixed(2));
  });

  it('emits warning when HSD price missing', async () => {
    mockPrisma.hSDMaster.findFirst.mockResolvedValueOnce(null);

    const result = await engine.calculate({
      ahspItemId: 'item-uuid',
      regionCode: 'ID-XX',
    });

    expect(result.warnings.length).toBeGreaterThan(0);
  });
});
