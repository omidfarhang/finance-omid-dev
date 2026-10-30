import { Test, TestingModule } from '@nestjs/testing';
import { Prisma } from '../generated/prisma/client';
import { AccountsService } from '../accounts/accounts.service';
import { PrismaService } from '../prisma/prisma.service';
import { ImportsService } from './imports.service';

describe('ImportsService', () => {
  let service: ImportsService;
  let prisma: {
    $transaction: Mock;
    importBatch: { create: Mock; update: Mock };
    transaction: { create: Mock };
  };
  let accountsService: { requireMemberAccount: Mock };

  const userId = '11111111-1111-1111-1111-111111111111';
  const accountId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  const csv = `date,amount,type,description,external_id,unit
2026-01-15,15000,EXPENSE,Coffee,ext-1,minor
`;

  beforeEach(async () => {
    prisma = {
      $transaction: vi.fn(),
      importBatch: { create: vi.fn(), update: vi.fn() },
      transaction: { create: vi.fn() },
    };
    accountsService = {
      requireMemberAccount: vi.fn().mockResolvedValue({
        id: accountId,
        currency: 'IRR',
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ImportsService,
        { provide: PrismaService, useValue: prisma },
        { provide: AccountsService, useValue: accountsService },
      ],
    }).compile();

    service = module.get(ImportsService);
  });

  it('creates rows on first import and skips duplicates on conflict', async () => {
    const batch = {
      id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
      userId,
      accountId,
      adapterId: 'generic_csv',
      originalFilename: 'a.csv',
      createdCount: 0,
      skippedDuplicateCount: 0,
      createdAt: new Date('2026-01-20T00:00:00.000Z'),
    };

    prisma.$transaction.mockImplementation(
      async (fn: (tx: typeof prisma) => Promise<unknown>) => {
        const tx = {
          importBatch: {
            create: vi.fn().mockResolvedValue(batch),
            update: vi.fn().mockImplementation(async ({ data }) => ({
              ...batch,
              ...data,
            })),
          },
          transaction: {
            create: vi
              .fn()
              .mockResolvedValueOnce({})
              .mockRejectedValueOnce(
                new Prisma.PrismaClientKnownRequestError('dup', {
                  code: 'P2002',
                  clientVersion: 'test',
                }),
              ),
          },
        };
        return fn(tx as never);
      },
    );

    const first = await service.importFile({
      userId,
      accountId,
      adapterId: 'generic_csv',
      originalFilename: 'a.csv',
      content: csv,
    });
    expect(first.created).toBe(1);
    expect(first.skippedDuplicate).toBe(0);

    // Second call with two identical logical rows simulated via create mock sequence
    prisma.$transaction.mockImplementation(
      async (fn: (tx: typeof prisma) => Promise<unknown>) => {
        const tx = {
          importBatch: {
            create: vi.fn().mockResolvedValue(batch),
            update: vi.fn().mockImplementation(async ({ data }) => ({
              ...batch,
              ...data,
            })),
          },
          transaction: {
            create: vi.fn().mockRejectedValue(
              new Prisma.PrismaClientKnownRequestError('dup', {
                code: 'P2002',
                clientVersion: 'test',
              }),
            ),
          },
        };
        return fn(tx as never);
      },
    );

    const second = await service.importFile({
      userId,
      accountId,
      adapterId: 'generic_csv',
      originalFilename: 'a.csv',
      content: csv,
    });
    expect(second.created).toBe(0);
    expect(second.skippedDuplicate).toBe(1);
  });
});
