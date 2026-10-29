import { Module } from '@nestjs/common';
import { AccountsModule } from '../accounts/accounts.module';
import { AuthModule } from '../auth/auth.module';
import { WalletsModule } from '../wallets/wallets.module';
import { AdminAccountsController } from './admin-accounts.controller';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminWalletsController } from './admin-wallets.controller';

@Module({
  imports: [AuthModule, WalletsModule, AccountsModule],
  controllers: [
    AdminController,
    AdminWalletsController,
    AdminAccountsController,
  ],
  providers: [AdminService],
})
export class AdminModule {}
