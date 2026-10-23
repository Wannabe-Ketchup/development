import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { MetricsService } from './metrics.service';

const MILLISECONDS_PER_SECOND = 1000;

@Injectable()
export class MetricsMiddleware implements NestMiddleware {
  constructor(private readonly metricsService: MetricsService) {}

  use(req: Request, res: Response, next: NextFunction): void {
    const startedAt = performance.now();

    res.on('finish', () => {
      const durationSeconds =
        (performance.now() - startedAt) / MILLISECONDS_PER_SECOND;
      const route = req.route as { path: string } | undefined;

      this.metricsService.recordHttpRequest(
        { method: req.method, route: route?.path, statusCode: res.statusCode },
        durationSeconds,
      );
    });

    next();
  }
}
