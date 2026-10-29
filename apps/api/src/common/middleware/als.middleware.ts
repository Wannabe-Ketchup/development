import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { AsyncLocalStorage } from 'node:async_hooks';
import { randomUUID } from 'node:crypto';

@Injectable()
export class AlsMiddleware implements NestMiddleware {
  constructor(private readonly als: AsyncLocalStorage<string>) {}

  use(_req: Request, _res: Response, next: NextFunction): void {
    const traceId = randomUUID();
    this.als.run(traceId, () => {
      next();
    });
  }
}
