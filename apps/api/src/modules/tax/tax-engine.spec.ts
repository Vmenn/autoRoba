import { Test, TestingModule } from '@nestjs/testing';
import Decimal from 'decimal.js';
import { TaxEngineService } from './tax-engine.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('TaxEngineService — PPh Final PP 9/2022 + PPN', () => {
  let engine: TaxEngineService;

  // Effective tax rates (PP 9/2022)
  const taxRates: Record<string, any> = {
    'JK-01': { code: 'JK-01', description: 'PPh Final Konstruksi – SBU Kecil', qualification: 'SBU Kecil', rate: new Decimal('0.0175'), legalBasis: 'PP 9/2022' },
    'JK-02': { code: 'JK-02', description: 'PPh Final Konstruksi – Menengah/Besar', qualification: 'Bersertifikat', rate: new Decimal('0.0265'), legalBasis: 'PP 9/2022' },
    'JK-03': { code: 'JK-03', description: 'PPh Final Konstruksi – Tanpa SBU', qualification: 'Tanpa SBU', rate: new Decimal('0.0400'), legalBasis: 'PP 9/2022' },
    'JK-04': { code: 'JK-04', description: 'PPh Final EPC – Memiliki SBU', qualification: 'Memiliki SBU', rate: new Decimal('0.0265'), legalBasis: 'PP 9/2022' },
    'JK-05': { code: 'JK-05', description: 'PPh Final EPC – Tanpa SBU', qualification: 'Tanpa SBU', rate: new Decimal('0.0400'), legalBasis: 'PP 9/2022' },
    'JK-06': { code: 'JK-06', description: 'PPh Final Konsultansi – Bersertifikat', qualification: 'SBU/SKK', rate: new Decimal('0.0350'), legalBasis: 'PP 9/2022' },
    'JK-07': { code: 'JK-07', description: 'PPh Final Konsultansi – Tanpa SBU', qualification: 'Tanpa SBU', rate: new Decimal('0.0600'), legalBasis: 'PP 9/2022' },
    'PPN': { code: 'PPN', description: 'Pajak Pertambahan Nilai', qualification: null, rate: new Decimal('0.1100'), legalBasis: 'UU PPN' },
  };

  const mockPrisma = {
    taxRate: {
      findFirst: jest.fn().mockImplementation(({ where }) => {
        const rate = taxRates[where.code];
        return Promise.resolve(rate ?? null);
      }),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaxEngineService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    engine = module.get<TaxEngineService>(TaxEngineService);
  });

  describe('Progress Claim calculation (§22.2)', () => {
    it('golden test — JK-04 EPC example from §43.3 API spec', async () => {
      // DPP 3,000,000,000 → PPN 330,000,000 → PPh Final 79,500,000 → net 3,250,500,000
      const result = await engine.calculateProgressClaim({
        dpp: 3_000_000_000,
        taxRateCode: 'JK-04',
      });

      expect(result.dpp).toBe('3000000000.00');
      expect(result.ppn.amount).toBe('330000000.00');
      expect(result.pphFinal.amount).toBe('79500000.00');
      expect(result.pphFinal.rate).toBe('0.0265');
      expect(result.netCashIn).toBe('3250500000.00');
    });

    it('deducts recoupment and retention from net cash-in', async () => {
      // DPP 1,000,000,000; recoupment 20%; retention 5%
      // Recoupment = 200,000,000; Retention = 50,000,000
      // PPN = 110,000,000; PPh Final (JK-04) = 26,500,000
      // Net = 1,000,000,000 + 110,000,000 − 26,500,000 − 200,000,000 − 50,000,000 = 833,500,000
      const result = await engine.calculateProgressClaim({
        dpp: 1_000_000_000,
        taxRateCode: 'JK-04',
        recoupmentPct: 20,
        retentionPct: 5,
      });

      expect(result.recoupment).toBe('200000000.00');
      expect(result.retention).toBe('50000000.00');
      expect(result.netCashIn).toBe('833500000.00');
    });

    it.each([
      ['JK-01', 0.0175],
      ['JK-02', 0.0265],
      ['JK-03', 0.0400],
      ['JK-04', 0.0265],
      ['JK-05', 0.0400],
      ['JK-06', 0.0350],
      ['JK-07', 0.0600],
    ])('applies correct rate for %s (%.4f)', async (code, expectedRate) => {
      const dpp = 100_000_000;
      const result = await engine.calculateProgressClaim({ dpp, taxRateCode: code });
      const expectedPph = new Decimal(dpp).times(expectedRate).toDecimalPlaces(2).toFixed(2);
      expect(result.pphFinal.amount).toBe(expectedPph);
      expect(parseFloat(result.pphFinal.rate)).toBeCloseTo(expectedRate);
    });

    it('PPN 11% calculation', async () => {
      const result = await engine.calculateProgressClaim({
        dpp: 1_000_000,
        taxRateCode: 'JK-04',
      });
      expect(result.ppn.amount).toBe('110000.00');
    });
  });
});
