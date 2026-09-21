import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

@Injectable()
export class HttpLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger(HttpLoggerMiddleware.name);

  use(req: Request, res: Response, next: NextFunction): void {
    const { method, originalUrl } = req;
    const ip = req.ip || 'unknown';
    const startTime = Date.now();

    // 진입 시점 로그는 클라이언트 IP, HTTP 메서드, 요청 URL 기록
    this.logger.log(`ip=${ip} method=${method} url=${originalUrl} START`);

    res.on('finish', () => {
      const { statusCode } = res;
      const duration = Date.now() - startTime;

      // 응답 완료 시점 로그는 상태 코드 및 소요 시간 기록
      this.logger.log(`status=${statusCode} duration=${duration}ms END`);
    });

    next();
  }
}
