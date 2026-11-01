import { BadRequestException, Injectable } from '@nestjs/common';
import type { ImportAdapterId, ImportResult, PublicImportAdapter } from '@finance/shared';
import { CategoryKind, Prisma } from '../generated/prisma/client';
import { AccountsService } from '../accounts/accounts.service';
import { requireUncategorizedId } from '../categories/category-defaults';
import { PrismaService } from '../prisma/prisma.service';
import { parseBlubankXlsx } from './blubank-xlsx.adapter';
import { parseGenericCsv } from './generic-csv.adapter';
import type { ParsedImportRow } from './import.types';
import { toPublicImportBatch } from './imports.mapper';

const ADAPTERS: PublicImportAdapter[] = [
  {
    id: 'generic_csv',
    label: 'Generic CSV (synthetic)',
    samplePath: '/samples/generic_csv.csv',
  },
  {
    id: 'blubank_xlsx',
    label: 'BluBank Excel',
    samplePath: '/samples/blubank_xlsx.xlsx',
  },
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
    content: Buffer;
  }): Promise<ImportResult> {
    const adapterId = input.adapterId as ImportAdapterId;
    if (adapterId !== 'generic_csv' && adapterId !== 'blubank_xlsx') {
      throw new BadRequestException('Unknown adapter');
    }

    const account = await this.accountsService.requireMemberAccount(
      input.userId,
      input.accountId,
    );

    const rows = this.parseRows(adapterId, input.content, account.currency);
    if (rows.length === 0) {
      throw new BadRequestException('File has no data rows');
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
          adapterId,
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

  private parseRows(
    adapterId: ImportAdapterId,
    content: Buffer,
    currency: string,
  ): ParsedImportRow[] {
    if (adapterId === 'generic_csv') {
      return parseGenericCsv(content.toString('utf8'));
    }

    if (currency !== 'IRR') {
      throw new BadRequestException(
        'BluBank Excel amounts are rials; import only into an IRR account',
      );
    }
    return parseBlubankXlsx(content);
  }
}
