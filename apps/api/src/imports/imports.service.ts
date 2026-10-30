import { BadRequestException, Injectable } from '@nestjs/common';
import type { ImportResult, PublicImportAdapter } from '@finance/shared';
import { CategoryKind, Prisma } from '../generated/prisma/client';
import { AccountsService } from '../accounts/accounts.service';
import { requireUncategorizedId } from '../categories/category-defaults';
import { PrismaService } from '../prisma/prisma.service';
import { parseGenericCsv } from './generic-csv.adapter';
import { toPublicImportBatch } from './imports.mapper';

const ADAPTERS: PublicImportAdapter[] = [
  { id: 'generic_csv', label: 'Generic CSV (synthetic)' },
];

@Injectable()
export class ImportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accountsService: AccountsService,
  ) {}

  listAdapters(): PublicImportAdapter[] {
    return ADAPTERS;
  }

  async importFile(input: {
    userId: string;
    accountId: string;
    adapterId: string;
    originalFilename: string;
    content: string;
  }): Promise<ImportResult> {
    if (input.adapterId !== 'generic_csv') {
      throw new BadRequestException('Unknown adapter');
    }

    await this.accountsService.requireMemberAccount(
      input.userId,
      input.accountId,
    );

    const rows = parseGenericCsv(input.content);
    if (rows.length === 0) {
      throw new BadRequestException('CSV has no data rows');
    }

    let created = 0;
    let skippedDuplicate = 0;

    const batch = await this.prisma.$transaction(async (tx) => {
      const incomeCategoryId = await requireUncategorizedId(
        tx,
        input.userId,
        CategoryKind.INCOME,
      );
      const expenseCategoryId = await requireUncategorizedId(
        tx,
        input.userId,
        CategoryKind.EXPENSE,
      );

      const createdBatch = await tx.importBatch.create({
        data: {
          userId: input.userId,
          accountId: input.accountId,
          adapterId: input.adapterId,
          originalFilename: input.originalFilename,
          createdCount: 0,
          skippedDuplicateCount: 0,
        },
      });

      for (const row of rows) {
        try {
          await tx.transaction.create({
            data: {
              type: row.type,
              accountId: input.accountId,
              amountMinor: row.amountMinor,
              occurredAt: row.occurredAt,
              description: row.description,
              categoryId:
                row.type === 'INCOME' ? incomeCategoryId : expenseCategoryId,
              dedupeKey: row.dedupeKey,
              importBatchId: createdBatch.id,
              createdByUserId: input.userId,
              shared: false,
            },
          });
          created += 1;
        } catch (err) {
          if (
            err instanceof Prisma.PrismaClientKnownRequestError &&
            err.code === 'P2002'
          ) {
            skippedDuplicate += 1;
            continue;
          }
          throw err;
        }
      }

      return tx.importBatch.update({
        where: { id: createdBatch.id },
        data: {
          createdCount: created,
          skippedDuplicateCount: skippedDuplicate,
        },
      });
    });

    return {
      batch: toPublicImportBatch(batch),
      created,
      skippedDuplicate,
    };
  }
}
