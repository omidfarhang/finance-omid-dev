import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { RecurringsController } from './recurrings.controller';
import { RecurringsService } from './recurrings.service';

@Module({
  imports: [AuthModule],
  controllers: [RecurringsController],
  providers: [RecurringsService],
  exports: [RecurringsService],
})
export class RecurringsModule {}
