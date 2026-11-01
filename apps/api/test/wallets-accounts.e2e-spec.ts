import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';

describe('Wallets and accounts (e2e)', () => {
  let app: INestApplication<App>;

  const password = 'password-long-enough';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.use(cookieParser());
    await app.init();
    const prisma = app.get(PrismaService);
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
    await client
      .post('/api/v1/auth/register')
      .send({ email, password, displayName })
      .expect(201);
    return client;
  }

  it('creates wallet and account; balance equals opening; outsider cannot read', async () => {
    const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const owner = await register(`owner-${suffix}@example.com`, 'Owner');
    const other = await register(`other-${suffix}@example.com`, 'Other');

    const walletRes = await owner
      .post('/api/v1/wallets')
      .send({ name: 'Personal' })
      .expect(201);

    const walletId = walletRes.body.wallet.id as string;

    const accountRes = await owner
      .post('/api/v1/accounts')
      .send({
        walletId,
        name: 'Cash',
        currency: 'irr',
        initialBalanceMinor: '250000',
        initialBalanceAsOf: '2026-01-01T00:00:00.000Z',
        isShared: true,
      })
      .expect(201);

    const account = accountRes.body.account;
    expect(account.currency).toBe('IRR');
    expect(account.openingBalanceMinor).toBeUndefined();
    expect(account.balanceMinor).toBe('250000');
    expect(account.isShared).toBe(true);

    const listRes = await owner.get('/api/v1/accounts').expect(200);
    expect(listRes.body.accounts).toHaveLength(1);
    expect(listRes.body.accounts[0].balanceMinor).toBe('250000');

    await other.get(`/api/v1/accounts/${account.id}`).expect(404);

    await owner
      .post(`/api/v1/accounts/${account.id}/members`)
      .send({ email: `other-${suffix}@example.com` })
      .expect(201);

    const sharedList = await other.get('/api/v1/accounts').expect(200);
    expect(sharedList.body.accounts).toHaveLength(1);
    expect(sharedList.body.accounts[0].id).toBe(account.id);
  });
});
