import { Module } from '@nestjs/common';
import { AuthController } from './controller/auth.controller';
import { SessionService } from './service/session.service';
import { SessionGuard } from './guard/session.guard';

@Module({
  controllers: [AuthController],
  providers: [SessionService, SessionGuard],
  exports: [SessionGuard, SessionService],
})
export class AuthModule {}
