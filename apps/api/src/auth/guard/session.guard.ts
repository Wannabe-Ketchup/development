import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { Reflector } from '@nestjs/core';
import { SessionService } from '../service/session.service';
import { IS_PUBLIC_KEY } from '../decorator/public.decorator';

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(
    private readonly sessionService: SessionService,
    private readonly reflector: Reflector,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    // Public 데코레이터가 붙은 핸들러는 인증을 통과한다.
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const req = context.switchToHttp().getRequest<Request>();
    const now = Date.now();

    // 세션이 유효하지 않다면 예외를 던진다.
    if (!this.sessionService.isValid(req.session, now)) {
      throw new UnauthorizedException();
    }

    this.sessionService.updateLastAccessedAt(req.session, now);
    return true;
  }
}
