import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as argon2 from 'argon2';
import { authenticator } from 'otplib';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: {
    user: {
      findUnique: jest.Mock;
      findUniqueOrThrow: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
    };
    session: { create: jest.Mock; deleteMany: jest.Mock; findUnique: jest.Mock; delete: jest.Mock };
    pendingLogin: {
      create: jest.Mock;
      findUnique: jest.Mock;
      delete: jest.Mock;
    };
  };

  const baseUser = {
    id: '11111111-1111-1111-1111-111111111111',
    email: 'a@example.com',
    passwordHash: '',
    displayName: 'Ada',
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
        findUnique: jest.fn(),
        findUniqueOrThrow: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      session: {
        create: jest.fn().mockResolvedValue({
          id: '22222222-2222-2222-2222-222222222222',
        }),
        deleteMany: jest.fn(),
        findUnique: jest.fn(),
        delete: jest.fn(),
      },
      pendingLogin: {
        create: jest.fn(),
        findUnique: jest.fn(),
        delete: jest.fn(),
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

  it('registers a new user and creates a session', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockImplementation(async ({ data }) => ({
      ...baseUser,
      email: data.email,
      displayName: data.displayName,
      passwordHash: data.passwordHash,
    }));

    const result = await service.register({
      email: 'A@Example.com',
      password: 'password-long',
      displayName: 'Ada',
    });

    expect(result.user.email).toBe('a@example.com');
    expect(result.sessionId).toBe('22222222-2222-2222-2222-222222222222');
  });

  it('rejects duplicate registration', async () => {
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

  it('requires TOTP when enabled', async () => {
    const secret = authenticator.generateSecret();
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
    const secret = authenticator.generateSecret();
    const code = authenticator.generate(secret);
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
