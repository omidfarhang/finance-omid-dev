import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type {
  LoginWithTotpDto,
  PublicUser,
  RegisterDto,
  TotpCodeDto,
  UpdateProfileDto,
} from '@finance/shared';
import * as argon2 from 'argon2';
import { authenticator } from 'otplib';
import * as QRCode from 'qrcode';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { toPublicUser } from '../users/users.mapper';
import {
  PENDING_LOGIN_TTL_MS,
  SESSION_TTL_MS,
} from './session.constants';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async register(dto: RegisterDto): Promise<{ user: PublicUser; sessionId: string }> {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await argon2.hash(dto.password);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        passwordHash,
        displayName: dto.displayName,
      },
    });

    const sessionId = await this.createSession(user.id);
    return { user: toPublicUser(user), sessionId };
  }

  async login(
    dto: LoginWithTotpDto,
  ): Promise<
    | { user: PublicUser; sessionId: string; requiresTotp?: false }
    | { requiresTotp: true; pendingToken: string }
  > {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const valid = await argon2.verify(user.passwordHash, dto.password);
    if (!valid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (user.totpEnabled) {
      if (dto.code) {
        this.assertTotp(user.totpSecret, dto.code);
        const sessionId = await this.createSession(user.id);
        return { user: toPublicUser(user), sessionId };
      }

      const pending = await this.prisma.pendingLogin.create({
        data: {
          userId: user.id,
          expiresAt: new Date(Date.now() + PENDING_LOGIN_TTL_MS),
        },
      });
      return { requiresTotp: true, pendingToken: pending.id };
    }

    const sessionId = await this.createSession(user.id);
    return { user: toPublicUser(user), sessionId };
  }

  async completeTotpLogin(
    pendingToken: string,
    dto: TotpCodeDto,
  ): Promise<{ user: PublicUser; sessionId: string }> {
    const pending = await this.prisma.pendingLogin.findUnique({
      where: { id: pendingToken },
      include: { user: true },
    });
    if (!pending || pending.expiresAt < new Date()) {
      if (pending) {
        await this.prisma.pendingLogin.delete({ where: { id: pending.id } }).catch(() => undefined);
      }
      throw new UnauthorizedException('Login challenge expired');
    }

    this.assertTotp(pending.user.totpSecret, dto.code);
    await this.prisma.pendingLogin.delete({ where: { id: pending.id } });
    const sessionId = await this.createSession(pending.user.id);
    return { user: toPublicUser(pending.user), sessionId };
  }

  async logout(sessionId: string | undefined): Promise<void> {
    if (!sessionId) return;
    await this.prisma.session.deleteMany({ where: { id: sessionId } });
  }

  async getUserForSession(sessionId: string | undefined): Promise<PublicUser | null> {
    if (!sessionId) return null;
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      include: { user: true },
    });
    if (!session || session.expiresAt < new Date()) {
      if (session) {
        await this.prisma.session.delete({ where: { id: session.id } }).catch(() => undefined);
      }
      return null;
    }
    return toPublicUser(session.user);
  }

  async updateProfile(userId: string, dto: UpdateProfileDto): Promise<PublicUser> {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        displayName: dto.displayName,
        locale: dto.locale === undefined ? undefined : dto.locale,
        timeZone: dto.timeZone === undefined ? undefined : dto.timeZone,
      },
    });
    return toPublicUser(user);
  }

  async beginTotpEnroll(userId: string): Promise<{ secret: string; otpauthUrl: string; qrDataUrl: string }> {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    if (user.totpEnabled) {
      throw new BadRequestException('2FA is already enabled');
    }

    const secret = authenticator.generateSecret();
    await this.prisma.user.update({
      where: { id: userId },
      data: { totpSecret: secret, totpEnabled: false },
    });

    const otpauthUrl = authenticator.keyuri(user.email, 'Finance Omid', secret);
    const qrDataUrl = await QRCode.toDataURL(otpauthUrl);
    return { secret, otpauthUrl, qrDataUrl };
  }

  async confirmTotpEnroll(userId: string, dto: TotpCodeDto): Promise<PublicUser> {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    if (!user.totpSecret) {
      throw new BadRequestException('Start 2FA enrollment first');
    }
    if (user.totpEnabled) {
      throw new BadRequestException('2FA is already enabled');
    }

    this.assertTotp(user.totpSecret, dto.code);
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { totpEnabled: true },
    });
    return toPublicUser(updated);
  }

  async disableTotp(userId: string, dto: TotpCodeDto): Promise<PublicUser> {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    if (!user.totpEnabled) {
      throw new BadRequestException('2FA is not enabled');
    }
    this.assertTotp(user.totpSecret, dto.code);
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { totpEnabled: false, totpSecret: null },
    });
    return toPublicUser(updated);
  }

  private assertTotp(secret: string | null, code: string) {
    if (!secret || !authenticator.verify({ token: code, secret })) {
      throw new UnauthorizedException('Invalid authentication code');
    }
  }

  private async createSession(userId: string): Promise<string> {
    const session = await this.prisma.session.create({
      data: {
        id: randomUUID(),
        userId,
        expiresAt: new Date(Date.now() + SESSION_TTL_MS),
      },
    });
    return session.id;
  }
}
