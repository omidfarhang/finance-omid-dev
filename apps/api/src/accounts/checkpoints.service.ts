import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  CreateCheckpointDto,
  UpdateCheckpointDto,
} from '@finance/shared';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AccountsService } from './accounts.service';
import { gapsForCheckpoints } from './balance';
import { parseMinorUnits } from './accounts.mapper';
import { toPublicCheckpoint } from './checkpoints.mapper';

@Injectable()
export class CheckpointsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accountsService: AccountsService,
  ) {}

  async listForAccount(userId: string, accountId: string) {
    await this.accountsService.requireMemberAccount(userId, accountId);
    return this.listAnnotated(accountId);
  }

  /** Checkpoints for all accounts the user can access (Activity timeline). */
  async listForUser(
    userId: string,
    opts?: { accountId?: string; from?: Date; to?: Date },
  ) {
    if (opts?.accountId) {
      await this.accountsService.requireMemberAccount(userId, opts.accountId);
    }

    const accountFilter = opts?.accountId
      ? { id: opts.accountId, members: { some: { userId } } }
      : { members: { some: { userId } } };

    const accounts = await this.prisma.account.findMany({
      where: accountFilter,
      select: { id: true },
    });
    if (accounts.length === 0) {
      return [];
    }

    const asOfFilter: Prisma.DateTimeFilter = {};
    if (opts?.from) {
      asOfFilter.gte = opts.from;
    }
    if (opts?.to) {
      asOfFilter.lte = opts.to;
    }

    const accountIds = accounts.map((a) => a.id);
    const where: Prisma.BalanceCheckpointWhereInput = {
      accountId: { in: accountIds },
    };
    if (opts?.from || opts?.to) {
      where.asOf = asOfFilter;
    }

    // Need full account checkpoints for correct gap math, then filter for response.
    const allCheckpoints = await this.prisma.balanceCheckpoint.findMany({
      where: { accountId: { in: accountIds } },
      orderBy: [{ asOf: 'desc' }, { createdAt: 'desc' }],
    });

    const movements = await this.prisma.transaction.findMany({
      where: {
        OR: [
          { accountId: { in: accountIds } },
          { counterAccountId: { in: accountIds } },
        ],
      },
      select: {
        type: true,
        accountId: true,
        counterAccountId: true,
        amountMinor: true,
        occurredAt: true,
      },
    });

    const byAccount = new Map<string, typeof allCheckpoints>();
    for (const cp of allCheckpoints) {
      const list = byAccount.get(cp.accountId) ?? [];
      list.push(cp);
      byAccount.set(cp.accountId, list);
    }

    const annotated = [];
    for (const [accountId, cps] of byAccount) {
      const gapRows = gapsForCheckpoints(accountId, cps, movements);
      const gapById = new Map(gapRows.map((g) => [g.id, g]));
      for (const cp of cps) {
        if (opts?.from && cp.asOf < opts.from) {
          continue;
        }
        if (opts?.to && cp.asOf > opts.to) {
          continue;
        }
        const gap = gapById.get(cp.id)!;
        annotated.push(
          toPublicCheckpoint(cp, gap.computedBalanceMinor, gap.gapMinor),
        );
      }
    }

    annotated.sort((a, b) => {
      const t = Date.parse(b.asOf) - Date.parse(a.asOf);
      if (t !== 0) {
        return t;
      }
      return b.id.localeCompare(a.id);
    });
    return annotated;
  }

  async create(userId: string, accountId: string, dto: CreateCheckpointDto) {
    await this.accountsService.requireMemberAccount(userId, accountId);
    const asOf = new Date(dto.asOf);
    const balanceMinor = parseMinorUnits(dto.balanceMinor);

    let createdId: string;
    try {
      const created = await this.prisma.balanceCheckpoint.create({
        data: {
          accountId,
          asOf,
          balanceMinor,
          note: dto.note ?? null,
          createdByUserId: userId,
        },
      });
      createdId = created.id;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'A checkpoint already exists at this as-of time',
        );
      }
      throw error;
    }

    const list = await this.listAnnotated(accountId);
    const row = list.find((c) => c.id === createdId);
    if (!row) {
      throw new NotFoundException('Checkpoint not found after create');
    }
    return row;
  }

  async update(userId: string, checkpointId: string, dto: UpdateCheckpointDto) {
    const existing = await this.requireMemberCheckpoint(userId, checkpointId);
    const data: Prisma.BalanceCheckpointUpdateInput = {};
    if (dto.asOf !== undefined) {
      data.asOf = new Date(dto.asOf);
    }
    if (dto.balanceMinor !== undefined) {
      data.balanceMinor = parseMinorUnits(dto.balanceMinor);
    }
    if (dto.note !== undefined) {
      data.note = dto.note;
    }

    try {
      await this.prisma.balanceCheckpoint.update({
        where: { id: checkpointId },
        data,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'A checkpoint already exists at this as-of time',
        );
      }
      throw error;
    }

    const list = await this.listAnnotated(existing.accountId);
    const updated = list.find((c) => c.id === checkpointId);
    if (!updated) {
      throw new NotFoundException('Checkpoint not found');
    }
    return updated;
  }

  async remove(userId: string, checkpointId: string) {
    const existing = await this.requireMemberCheckpoint(userId, checkpointId);
    const count = await this.prisma.balanceCheckpoint.count({
      where: { accountId: existing.accountId },
    });
    if (count <= 1) {
      throw new BadRequestException('Cannot delete the last checkpoint');
    }
    await this.prisma.balanceCheckpoint.delete({ where: { id: checkpointId } });
  }

  private async listAnnotated(accountId: string) {
    const checkpoints = await this.prisma.balanceCheckpoint.findMany({
      where: { accountId },
    });
    const movements = await this.prisma.transaction.findMany({
      where: {
        OR: [{ accountId }, { counterAccountId: accountId }],
      },
      select: {
        type: true,
        accountId: true,
        counterAccountId: true,
        amountMinor: true,
        occurredAt: true,
      },
    });
    const gapRows = gapsForCheckpoints(accountId, checkpoints, movements);
    const gapById = new Map(gapRows.map((g) => [g.id, g]));

    const publicRows = checkpoints.map((cp) => {
      const gap = gapById.get(cp.id)!;
      return toPublicCheckpoint(cp, gap.computedBalanceMinor, gap.gapMinor);
    });

    publicRows.sort((a, b) => {
      const t = Date.parse(b.asOf) - Date.parse(a.asOf);
      if (t !== 0) {
        return t;
      }
      return b.id.localeCompare(a.id);
    });
    return publicRows;
  }

  private async requireMemberCheckpoint(userId: string, checkpointId: string) {
    const checkpoint = await this.prisma.balanceCheckpoint.findFirst({
      where: {
        id: checkpointId,
        account: { members: { some: { userId } } },
      },
    });
    if (!checkpoint) {
      throw new NotFoundException('Checkpoint not found');
    }
    return checkpoint;
  }
}
