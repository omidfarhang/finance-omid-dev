import { Module } from '@nestjs/common';
import { AdminGuard } from './admin.guard';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { SessionGuard } from './session.guard';

@Module({
  controllers: [AuthController],
  providers: [AuthService, SessionGuard, AdminGuard],
  exports: [AuthService, SessionGuard, AdminGuard],
})
export class AuthModule {}
