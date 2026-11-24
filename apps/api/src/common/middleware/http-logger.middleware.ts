import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

const NO_PARTICIPANT = 'none';

// 같은 IP를 쓰는 사용자를 구분하려고 참여자 ID를 함께 남긴다
function participantIdOf(req: Request): string {
  return req.session?.participantId ?? NO_PARTICIPANT;
}

@Injectable()
export class HttpLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger(HttpLoggerMiddleware.name);

  use(req: Request, res: Response, next: NextFunction): void {
    const { method, originalUrl } = req;
    const ip = req.ip || 'unknown';
    const startTime = Date.now();

    // 진입 시점 로그는 클라이언트 IP, 참여자 ID, HTTP 메서드, 요청 URL 기록
    this.logger.log(
      `ip=${ip} participantId=${participantIdOf(req)} method=${method} url=${originalUrl} START`,
    );

    res.on('finish', () => {
      const { statusCode } = res;
      const duration = Date.now() - startTime;

      // 응답 완료 시점에 다시 읽어 게스트 로그인처럼 요청 중에 생긴 참여자 ID도 남긴다
      this.logger.log(
        `participantId=${participantIdOf(req)} status=${statusCode} duration=${duration}ms END`,
      );
    });

    next();
  }
}
