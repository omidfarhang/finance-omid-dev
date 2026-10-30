import {
  ConflictException,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as argon2 from 'argon2';
import { generate, generateSecret } from 'otplib';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: {
    user: {
      findUnique: Mock;
      findUniqueOrThrow: Mock;
      create: Mock;
      update: Mock;
      count: Mock;
    };
    session: {
      create: Mock;
      deleteMany: Mock;
      findUnique: Mock;
      delete: Mock;
    };
    pendingLogin: {
      create: Mock;
      findUnique: Mock;
      delete: Mock;
    };
    appSettings: {
      upsert: Mock;
    };
  };

  const baseUser = {
    id: '11111111-1111-1111-1111-111111111111',
    email: 'a@example.com',
    passwordHash: '',
    displayName: 'Ada',
    role: 'ADMIN' as const,
    disabledAt: null as Date | null,
    locale: null,
    timeZone: null,
    totpSecret: null as string | null,
    totpEnabled: false,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  };

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: vi.fn(),
        findUniqueOrThrow: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        count: vi.fn().mockResolvedValue(0),
      },
      session: {
        create: vi.fn().mockResolvedValue({
          id: '22222222-2222-2222-2222-222222222222',
        }),
        deleteMany: vi.fn(),
        findUnique: vi.fn(),
        delete: vi.fn(),
      },
      pendingLogin: {
        create: vi.fn(),
        findUnique: vi.fn(),
        delete: vi.fn(),
      },
      appSettings: {
        upsert: vi.fn().mockResolvedValue({
          id: 1,
          registrationOpen: true,
        }),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  it('registers the first user as ADMIN', async () => {
    prisma.user.count.mockResolvedValue(0);
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockImplementation(async ({ data }) => ({
      ...baseUser,
      email: data.email,
      displayName: data.displayName,
      passwordHash: data.passwordHash,
      role: data.role,
    }));

    const result = await service.register({
      email: 'A@Example.com',
      password: 'password-long',
      displayName: 'Ada',
    });

    expect(result.user.email).toBe('a@example.com');
    expect(result.user.role).toBe('ADMIN');
    expect(result.sessionId).toBe('22222222-2222-2222-2222-222222222222');
  });

  it('rejects registration when closed and users exist', async () => {
    prisma.user.count.mockResolvedValue(1);
    prisma.appSettings.upsert.mockResolvedValue({
      id: 1,
      registrationOpen: false,
    });

    await expect(
      service.register({
        email: 'b@example.com',
        password: 'password-long',
        displayName: 'Bob',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects duplicate registration', async () => {
    prisma.user.count.mockResolvedValue(1);
    prisma.user.findUnique.mockResolvedValue(baseUser);
    await expect(
      service.register({
        email: 'a@example.com',
        password: 'password-long',
        displayName: 'Ada',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects invalid login password', async () => {
    prisma.user.findUnique.mockResolvedValue({
      ...baseUser,
      passwordHash: await argon2.hash('password-long'),
    });

    await expect(
      service.login({ email: 'a@example.com', password: 'wrong-password' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects login for disabled users', async () => {
    prisma.user.findUnique.mockResolvedValue({
      ...baseUser,
      passwordHash: await argon2.hash('password-long'),
      disabledAt: new Date(),
    });

    await expect(
      service.login({ email: 'a@example.com', password: 'password-long' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('requires TOTP when enabled', async () => {
    const secret = generateSecret();
    prisma.user.findUnique.mockResolvedValue({
      ...baseUser,
      passwordHash: await argon2.hash('password-long'),
      totpEnabled: true,
      totpSecret: secret,
    });
    prisma.pendingLogin.create.mockResolvedValue({
      id: '33333333-3333-3333-3333-333333333333',
    });

    const result = await service.login({
      email: 'a@example.com',
      password: 'password-long',
    });

    expect(result).toEqual({
      requiresTotp: true,
      pendingToken: '33333333-3333-3333-3333-333333333333',
    });
  });

  it('completes TOTP login with a valid code', async () => {
    const secret = generateSecret();
    const code = await generate({ secret });
    prisma.pendingLogin.findUnique.mockResolvedValue({
      id: '33333333-3333-3333-3333-333333333333',
      expiresAt: new Date(Date.now() + 60_000),
      user: { ...baseUser, totpEnabled: true, totpSecret: secret },
    });
    prisma.pendingLogin.delete.mockResolvedValue({});

    const result = await service.completeTotpLogin(
      '33333333-3333-3333-3333-333333333333',
      { code },
    );

    expect(result.user.email).toBe('a@example.com');
    expect(result.sessionId).toBeTruthy();
  });
});
