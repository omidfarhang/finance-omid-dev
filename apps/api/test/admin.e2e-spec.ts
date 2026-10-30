import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { UserRole } from '../src/generated/prisma/client';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';

describe('Instance admin (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  const password = 'password-long-enough';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.use(cookieParser());
    await app.init();
    prisma = app.get(PrismaService);
    await prisma.appSettings.upsert({
      where: { id: 1 },
      create: { id: 1, registrationOpen: true },
      update: { registrationOpen: true },
    });
  });

  afterAll(async () => {
    await app.close();
  });

  function agent() {
    return request.agent(app.getHttpServer());
  }

  async function register(email: string, displayName: string) {
    const client = agent();
    const res = await client
      .post('/api/v1/auth/register')
      .send({ email, password, displayName })
      .expect(201);
    return { client, user: res.body.user as { id: string; role: string } };
  }

  async function promote(userId: string) {
    await prisma.user.update({
      where: { id: userId },
      data: { role: UserRole.ADMIN },
    });
  }

  it('exposes registration status and rejects closed registration', async () => {
    const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const { client: adminClient, user: admin } = await register(
      `admin-close-${suffix}@example.com`,
      'Admin',
    );
    await promote(admin.id);

    await adminClient
      .patch('/api/v1/admin/settings')
      .send({ registrationOpen: false })
      .expect(200);

    const status = await agent()
      .get('/api/v1/auth/registration-status')
      .expect(200);
    expect(status.body.open).toBe(false);
    expect(status.body.bootstrapAllowed).toBe(false);

    await agent()
      .post('/api/v1/auth/register')
      .send({
        email: `blocked-${suffix}@example.com`,
        password,
        displayName: 'Blocked',
      })
      .expect(403);

    await adminClient
      .patch('/api/v1/admin/settings')
      .send({ registrationOpen: true })
      .expect(200);
  });

  it('lets admin manage users and access another user’s wallets', async () => {
    const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const { client: adminClient, user: admin } = await register(
      `admin-ops-${suffix}@example.com`,
      'Admin',
    );
    await promote(admin.id);

    const { client: memberClient, user: member } = await register(
      `member-ops-${suffix}@example.com`,
      'Member',
    );

    const walletRes = await memberClient
      .post('/api/v1/wallets')
      .send({ name: 'Personal' })
      .expect(201);
    const walletId = walletRes.body.wallet.id as string;

    await memberClient
      .post('/api/v1/accounts')
      .send({
        walletId,
        name: 'Cash',
        currency: 'IRR',
        openingBalanceMinor: '1000',
        isShared: false,
      })
      .expect(201);

    const list = await adminClient.get('/api/v1/admin/users').expect(200);
    expect(
      list.body.users.some((u: { id: string }) => u.id === member.id),
    ).toBe(true);

    const adminWallets = await adminClient
      .get(`/api/v1/admin/users/${member.id}/wallets`)
      .expect(200);
    expect(adminWallets.body.wallets).toHaveLength(1);

    await memberClient.get('/api/v1/admin/users').expect(403);

    await adminClient
      .patch(`/api/v1/admin/users/${member.id}`)
      .send({ disabled: true })
      .expect(200);

    await agent()
      .post('/api/v1/auth/login')
      .send({ email: `member-ops-${suffix}@example.com`, password })
      .expect(401);

    await adminClient
      .patch(`/api/v1/admin/users/${member.id}`)
      .send({ disabled: false })
      .expect(200);
  });

  it('rejects demoting the last remaining admin', async () => {
    const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const { client, user } = await register(
      `solo-admin-${suffix}@example.com`,
      'Solo',
    );
    await promote(user.id);

    // Ensure this user is the only non-disabled admin for the assertion path:
    // demote every other admin temporarily if present, then restore.
    const others = await prisma.user.findMany({
      where: {
        role: UserRole.ADMIN,
        id: { not: user.id },
        disabledAt: null,
      },
    });
    for (const other of others) {
      await prisma.user.update({
        where: { id: other.id },
        data: { role: UserRole.USER },
      });
    }

    await client
      .patch(`/api/v1/admin/users/${user.id}`)
      .send({ role: 'USER' })
      .expect(400);

    for (const other of others) {
      await prisma.user.update({
        where: { id: other.id },
        data: { role: UserRole.ADMIN },
      });
    }
  });
});
