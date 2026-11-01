import { createHash } from 'node:crypto';
import { BadRequestException } from '@nestjs/common';
import { civilDateTimeToUtc } from '@finance/shared';
import { TransactionType } from '../generated/prisma/client';
import type { ParsedImportRow } from './import.types';
import * as XLSX from 'xlsx';

const BLUBANK_TZ = 'Asia/Tehran';

const COL = {
  balance: 'مانده (ریال)',
  debit: 'برداشت (ریال)',
  credit: 'واریز (ریال)',
  kind: 'نوع تراکنش',
  description: 'شرح سند',
  documentNo: 'شماره سند',
  date: 'تاریخ',
  row: 'ردیف',
} as const;

function normalizeDescription(value: string | undefined): string {
  return (value ?? '').trim().replace(/\s+/g, ' ');
}

function cellString(value: unknown): string {
  if (value == null) {
    return '';
  }
  if (typeof value === 'string') {
    return value.trim();
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    // Excel may store document numbers / row indices as floats.
    if (Number.isInteger(value)) {
      return String(value);
    }
    const asInt = Math.round(value);
    if (Math.abs(value - asInt) < 1e-6) {
      return String(asInt);
    }
    return String(value);
  }
  return String(value).trim();
}

function parseRialAmount(value: unknown, rowLabel: string): bigint {
  if (value == null || value === '') {
    return 0n;
  }
  let n: number;
  if (typeof value === 'number') {
    n = value;
  } else {
    const raw = String(value).replace(/,/g, '').trim();
    if (!raw) {
      return 0n;
    }
    n = Number(raw);
  }
  if (!Number.isFinite(n) || n < 0) {
    throw new BadRequestException(`${rowLabel}: invalid amount`);
  }
  if (n === 0) {
    return 0n;
  }
  const rounded = Math.round(n);
  if (Math.abs(n - rounded) > 1e-6) {
    throw new BadRequestException(
      `${rowLabel}: amount must be a whole number of rials`,
    );
  }
  if (rounded <= 0) {
    return 0n;
  }
  return BigInt(rounded);
}

function parseJalaliDateTime(raw: string, rowLabel: string): {
  occurredAt: Date;
  jalaliRaw: string;
} {
  const match = raw
    .trim()
    .match(
      /^(\d{4})\/(\d{1,2})\/(\d{1,2})(?:\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?$/,
    );
  if (!match) {
    throw new BadRequestException(
      `${rowLabel}: invalid Jalali date (expected YYYY/MM/DD HH:mm:ss)`,
    );
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4] ?? 0);
  const minute = Number(match[5] ?? 0);
  const second = Number(match[6] ?? 0);
  const occurredAt = civilDateTimeToUtc(
    { year, month, day },
    hour,
    minute,
    second,
    'JALALI',
    BLUBANK_TZ,
  );
  if (Number.isNaN(occurredAt.getTime())) {
    throw new BadRequestException(`${rowLabel}: invalid Jalali date`);
  }
  const jalaliRaw = `${year}/${String(month).padStart(2, '0')}/${String(day).padStart(2, '0')} ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}`;
  return { occurredAt, jalaliRaw };
}

function dedupeKeyForRow(input: {
  documentNo: string;
  type: string;
  amount: string;
  jalaliRaw: string;
  description: string;
}): string {
  if (input.documentNo) {
    return `blubank_xlsx|${input.documentNo}|${input.type}|${input.amount}|${input.jalaliRaw}`;
  }
  const material = `blubank_xlsx|${input.jalaliRaw}|${input.type}|${input.amount}|${input.description}`;
  return createHash('sha256').update(material).digest('hex');
}

function findHeaderRow(
  rows: unknown[][],
): { headerIndex: number; colIndex: Record<string, number> } {
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i] ?? [];
    const labels = row.map((c) => cellString(c));
    const debitI = labels.findIndex((l) => l === COL.debit);
    const creditI = labels.findIndex((l) => l === COL.credit);
    const dateI = labels.findIndex((l) => l === COL.date);
    if (debitI >= 0 && creditI >= 0 && dateI >= 0) {
      const colIndex: Record<string, number> = {
        debit: debitI,
        credit: creditI,
        date: dateI,
      };
      const optional: Array<[keyof typeof COL, string]> = [
        ['balance', COL.balance],
        ['kind', COL.kind],
        ['description', COL.description],
        ['documentNo', COL.documentNo],
        ['row', COL.row],
      ];
      for (const [key, label] of optional) {
        const idx = labels.findIndex((l) => l === label);
        if (idx >= 0) {
          colIndex[key] = idx;
        }
      }
      // Require explicit rial labeling on debit/credit (already exact-match).
      if (!labels[debitI]!.includes('(ریال)') || !labels[creditI]!.includes('(ریال)')) {
        throw new BadRequestException(
          'BluBank headers must label amounts as (ریال); refusing to infer unit',
        );
      }
      return { headerIndex: i, colIndex };
    }
  }
  throw new BadRequestException(
    'BluBank Excel: could not find header row with برداشت/واریز (ریال) and تاریخ',
  );
}

export function parseBlubankXlsx(buffer: Buffer): ParsedImportRow[] {
  if (!buffer?.length) {
    throw new BadRequestException('Excel file is empty');
  }

  let workbook: XLSX.WorkBook;
  try {
    workbook = XLSX.read(buffer, { type: 'buffer', cellDates: false });
  } catch {
    throw new BadRequestException('File is not a valid Excel workbook');
  }

  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    throw new BadRequestException('Excel workbook has no sheets');
  }
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) {
    throw new BadRequestException('Excel workbook has no sheets');
  }

  const matrix = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    raw: true,
    defval: '',
  }) as unknown[][];

  if (matrix.length === 0) {
    throw new BadRequestException('Excel sheet is empty');
  }

  const { headerIndex, colIndex } = findHeaderRow(matrix);
  const rows: ParsedImportRow[] = [];

  for (let i = headerIndex + 1; i < matrix.length; i++) {
    const row = matrix[i] ?? [];
    const rowLabel = `Row ${i + 1}`;
    const dateRaw = cellString(row[colIndex.date!]);
    if (!dateRaw) {
      continue;
    }

    const debit = parseRialAmount(row[colIndex.debit!], rowLabel);
    const credit = parseRialAmount(row[colIndex.credit!], rowLabel);
    if (debit === 0n && credit === 0n) {
      continue;
    }
    if (debit > 0n && credit > 0n) {
      throw new BadRequestException(
        `${rowLabel}: both برداشت and واریز are non-zero`,
      );
    }

    const type =
      credit > 0n
        ? (TransactionType.INCOME as typeof TransactionType.INCOME)
        : (TransactionType.EXPENSE as typeof TransactionType.EXPENSE);
    const amountMinor = credit > 0n ? credit : debit;
    const { occurredAt, jalaliRaw } = parseJalaliDateTime(dateRaw, rowLabel);

    const kind =
      colIndex.kind != null ? cellString(row[colIndex.kind]) : '';
    const memo =
      colIndex.description != null
        ? cellString(row[colIndex.description])
        : '';
    const description = normalizeDescription(
      [kind, memo].filter(Boolean).join(' — ') || undefined,
    );
    const documentNo =
      colIndex.documentNo != null
        ? cellString(row[colIndex.documentNo])
        : '';

    rows.push({
      type,
      amountMinor,
      occurredAt,
      description: description || null,
      dedupeKey: dedupeKeyForRow({
        documentNo,
        type,
        amount: amountMinor.toString(),
        jalaliRaw,
        description,
      }),
    });
  }

  if (rows.length === 0) {
    throw new BadRequestException('BluBank Excel has no data rows');
  }

  return rows;
}
