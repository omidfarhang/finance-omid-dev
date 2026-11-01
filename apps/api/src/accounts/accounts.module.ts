import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { WalletsModule } from '../wallets/wallets.module';
import {
  AccountCheckpointsController,
  CheckpointsController,
} from './account-checkpoints.controller';
import { AccountsController } from './accounts.controller';
import { AccountsService } from './accounts.service';
import { CheckpointsService } from './checkpoints.service';

@Module({
  imports: [AuthModule, WalletsModule],
  controllers: [
    AccountsController,
    AccountCheckpointsController,
    CheckpointsController,
  ],
  providers: [AccountsService, CheckpointsService],
  exports: [AccountsService, CheckpointsService],
})
export class AccountsModule {}
