import { Module } from '@nestjs/common';
import { AccountsModule } from './accounts/accounts.module';
import { AdminModule } from './admin/admin.module';
import { AuthModule } from './auth/auth.module';
import { CategoriesModule } from './categories/categories.module';
import { HealthController } from './health.controller';
import { ImportsModule } from './imports/imports.module';
import { PrismaModule } from './prisma/prisma.module';
import { RecurringsModule } from './recurrings/recurrings.module';
import { TransactionsModule } from './transactions/transactions.module';
import { WalletsModule } from './wallets/wallets.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    AdminModule,
    WalletsModule,
    AccountsModule,
    CategoriesModule,
    TransactionsModule,
    ImportsModule,
    RecurringsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
