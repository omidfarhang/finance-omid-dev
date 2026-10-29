import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  AppSettingsDto,
  UpdateAdminUserDto,
  UpdateAppSettingsDto,
} from '@finance/shared';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { toAdminUser } from '../users/users.mapper';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getSettings(): Promise<AppSettingsDto> {
    const settings = await this.ensureAppSettings();
    return { registrationOpen: settings.registrationOpen };
  }

  async updateSettings(dto: UpdateAppSettingsDto): Promise<AppSettingsDto> {
    const settings = await this.prisma.appSettings.upsert({
      where: { id: 1 },
      create: { id: 1, registrationOpen: dto.registrationOpen },
      update: { registrationOpen: dto.registrationOpen },
    });
    return { registrationOpen: settings.registrationOpen };
  }

  async listUsers() {
    const users = await this.prisma.user.findMany({
      orderBy: { createdAt: 'asc' },
    });
    return users.map(toAdminUser);
  }

  async updateUser(targetUserId: string, dto: UpdateAdminUserDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: targetUserId },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (dto.role === 'USER' && user.role === UserRole.ADMIN) {
      await this.assertNotLastAdmin(targetUserId);
    }

    if (dto.disabled === true && user.role === UserRole.ADMIN) {
      await this.assertNotLastAdmin(targetUserId);
    }

    const updated = await this.prisma.user.update({
      where: { id: targetUserId },
      data: {
        role: dto.role,
        disabledAt:
          dto.disabled === undefined
            ? undefined
            : dto.disabled
              ? new Date()
              : null,
      },
    });

    if (dto.disabled === true) {
      await this.prisma.session.deleteMany({ where: { userId: targetUserId } });
      await this.prisma.pendingLogin.deleteMany({
        where: { userId: targetUserId },
      });
    }

    return toAdminUser(updated);
  }

  async deleteUser(targetUserId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: targetUserId },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role === UserRole.ADMIN) {
      await this.assertNotLastAdmin(targetUserId);
    }

    await this.prisma.$transaction(async (tx) => {
      const ownedWallets = await tx.wallet.findMany({
        where: { ownerUserId: targetUserId },
        select: { id: true },
      });
      const walletIds = ownedWallets.map((wallet) => wallet.id);

      if (walletIds.length > 0) {
        await tx.account.deleteMany({
          where: { walletId: { in: walletIds } },
        });
        await tx.wallet.deleteMany({
          where: { id: { in: walletIds } },
        });
      }

      await tx.accountMember.deleteMany({ where: { userId: targetUserId } });
      await tx.session.deleteMany({ where: { userId: targetUserId } });
      await tx.pendingLogin.deleteMany({ where: { userId: targetUserId } });
      await tx.user.delete({ where: { id: targetUserId } });
    });
  }

  private async assertNotLastAdmin(userId: string) {
    const adminCount = await this.prisma.user.count({
      where: { role: UserRole.ADMIN, disabledAt: null },
    });
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (
      adminCount <= 1 &&
      user?.role === UserRole.ADMIN &&
      user.disabledAt === null
    ) {
      throw new BadRequestException('Cannot modify the last admin');
    }
  }

  private async ensureAppSettings() {
    return this.prisma.appSettings.upsert({
      where: { id: 1 },
      create: { id: 1, registrationOpen: true },
      update: {},
    });
  }
}
