import { Module } from '@nestjs/common';
import { AccountsModule } from '../accounts/accounts.module';
import { AuthModule } from '../auth/auth.module';
import { ImportsController } from './imports.controller';
import { ImportsService } from './imports.service';

@Module({
  imports: [AuthModule, AccountsModule],
  controllers: [ImportsController],
  providers: [ImportsService],
})
export class ImportsModule {}
