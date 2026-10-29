import { Module } from '@nestjs/common';
import { AccountsModule } from './accounts/accounts.module';
import { AuthModule } from './auth/auth.module';
import { HealthController } from './health.controller';
import { PrismaModule } from './prisma/prisma.module';
import { WalletsModule } from './wallets/wallets.module';

@Module({
  imports: [PrismaModule, AuthModule, WalletsModule, AccountsModule],
  controllers: [HealthController],
})
export class AppModule {}
