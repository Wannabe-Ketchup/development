import { Controller, HttpCode, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { SessionService } from '../service/session.service';
import { Public } from '../decorator/public.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly sessionService: SessionService) {}

  @Public()
  @Post('/login/guest')
  @HttpCode(204)
  loginGuest(@Req() req: Request): void {
    this.sessionService.issueSession(req.session, Date.now());
  }
}
