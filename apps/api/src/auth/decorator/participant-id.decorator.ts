import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';

// 요청한 사용자의 participantId를 로그인 세션에서 꺼낸다.
// 전역 SessionGuard가 세션을 보장하지만, 값이 없으면 401로 막는다.
export const ParticipantId = createParamDecorator(
  (_data: unknown, context: ExecutionContext): string => {
    const req = context.switchToHttp().getRequest<Request>();
    const participantId = req.session?.participantId;
    if (!participantId) {
      throw new UnauthorizedException();
    }
    return participantId;
  },
);
