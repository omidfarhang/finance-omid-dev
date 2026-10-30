import { createHash } from 'node:crypto';
import { BadRequestException } from '@nestjs/common';
import { TransactionType } from '../generated/prisma/client';

export type ParsedImportRow = {
  type: typeof TransactionType.INCOME | typeof TransactionType.EXPENSE;
  amountMinor: bigint;
  occurredAt: Date;
  description: string | null;
  dedupeKey: string;
};

function normalizeDescription(value: string | undefined): string {
  return (value ?? '').trim().replace(/\s+/g, ' ');
}

function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]!;
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      cells.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  cells.push(current);
  return cells.map((c) => c.trim());
}

function dedupeKeyForRow(input: {
  externalId: string;
  date: string;
  type: string;
  amount: string;
  description: string;
}): string {
  if (input.externalId) {
    return input.externalId;
  }
  const material = `generic_csv|${input.date}|${input.type}|${input.amount}|${input.description}`;
  return createHash('sha256').update(material).digest('hex');
}

export function parseGenericCsv(content: string): ParsedImportRow[] {
  const text = content.replace(/^\uFEFF/, '').trim();
  if (!text) {
    throw new BadRequestException('CSV file is empty');
  }

  const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length < 2) {
    throw new BadRequestException('CSV must include a header and at least one row');
  }

  const header = parseCsvLine(lines[0]!).map((h) => h.toLowerCase());
  const required = ['date', 'amount', 'type', 'unit'];
  for (const col of required) {
    if (!header.includes(col)) {
      throw new BadRequestException(`CSV missing required column: ${col}`);
    }
  }

  const idx = (name: string) => header.indexOf(name);
  const dateI = idx('date');
  const amountI = idx('amount');
  const typeI = idx('type');
  const unitI = idx('unit');
  const descI = idx('description');
  const extI = idx('external_id');

  const rows: ParsedImportRow[] = [];
  for (let lineNo = 1; lineNo < lines.length; lineNo++) {
    const cells = parseCsvLine(lines[lineNo]!);
    const unit = (cells[unitI] ?? '').toLowerCase();
    if (unit !== 'minor') {
      throw new BadRequestException(
        `Row ${lineNo + 1}: unit must be "minor" (explicit minor units; never infer rial vs toman)`,
      );
    }

    const typeRaw = (cells[typeI] ?? '').toUpperCase();
    if (typeRaw !== 'INCOME' && typeRaw !== 'EXPENSE') {
      throw new BadRequestException(
        `Row ${lineNo + 1}: type must be INCOME or EXPENSE`,
      );
    }

    const amountRaw = cells[amountI] ?? '';
    if (!/^\d+$/.test(amountRaw) || BigInt(amountRaw) <= 0n) {
      throw new BadRequestException(
        `Row ${lineNo + 1}: amount must be a positive integer minor-units string`,
      );
    }

    const dateRaw = cells[dateI] ?? '';
    const occurredAt = new Date(
      dateRaw.includes('T') ? dateRaw : `${dateRaw}T00:00:00.000Z`,
    );
    if (Number.isNaN(occurredAt.getTime())) {
      throw new BadRequestException(`Row ${lineNo + 1}: invalid date`);
    }

    const description = normalizeDescription(
      descI >= 0 ? cells[descI] : undefined,
    );
    const externalId = (extI >= 0 ? cells[extI] : '')?.trim() ?? '';

    rows.push({
      type: typeRaw as typeof TransactionType.INCOME | typeof TransactionType.EXPENSE,
      amountMinor: BigInt(amountRaw),
      occurredAt,
      description: description || null,
      dedupeKey: dedupeKeyForRow({
        externalId,
        date: dateRaw,
        type: typeRaw,
        amount: amountRaw,
        description,
      }),
    });
  }

  return rows;
}
