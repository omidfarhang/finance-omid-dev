import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { CreateWalletDto, UpdateWalletDto } from '@finance/shared';
import { PrismaService } from '../prisma/prisma.service';
import { toPublicWallet } from './wallets.mapper';

@Injectable()
export class WalletsService {
  constructor(private readonly prisma: PrismaService) {}

  async listForUser(userId: string) {
    const wallets = await this.prisma.wallet.findMany({
      where: { ownerUserId: userId },
      orderBy: { createdAt: 'asc' },
    });
    return wallets.map(toPublicWallet);
  }

  async getForUser(userId: string, walletId: string) {
    const wallet = await this.requireOwnedWallet(userId, walletId);
    return toPublicWallet(wallet);
  }

  async create(userId: string, dto: CreateWalletDto) {
    const wallet = await this.prisma.wallet.create({
      data: {
        ownerUserId: userId,
        name: dto.name,
      },
    });
    return toPublicWallet(wallet);
  }

  async update(userId: string, walletId: string, dto: UpdateWalletDto) {
    await this.requireOwnedWallet(userId, walletId);
    const wallet = await this.prisma.wallet.update({
      where: { id: walletId },
      data: { name: dto.name },
    });
    return toPublicWallet(wallet);
  }

  async remove(userId: string, walletId: string) {
    await this.requireOwnedWallet(userId, walletId);
    const accountCount = await this.prisma.account.count({
      where: { walletId },
    });
    if (accountCount > 0) {
      throw new BadRequestException(
        'Wallet still has accounts; delete them first',
      );
    }
    await this.prisma.wallet.delete({ where: { id: walletId } });
  }

  async requireOwnedWallet(userId: string, walletId: string) {
    const wallet = await this.prisma.wallet.findUnique({
      where: { id: walletId },
    });
    if (!wallet || wallet.ownerUserId !== userId) {
      throw new NotFoundException('Wallet not found');
    }
    return wallet;
  }
}
