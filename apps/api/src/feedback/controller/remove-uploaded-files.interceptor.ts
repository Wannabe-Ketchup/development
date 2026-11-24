import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import type { Request } from 'express';
import { rm } from 'node:fs/promises';
import { lastValueFrom, Observable, of } from 'rxjs';

// 파이프 검증 실패처럼 핸들러까지 가지 못한 경우에도 임시 파일을 지우려고 핸들러 바깥에서 지운다
@Injectable()
export class RemoveUploadedFilesInterceptor implements NestInterceptor {
  private readonly logger = new Logger(RemoveUploadedFilesInterceptor.name);

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<unknown>> {
    const request = context.switchToHttp().getRequest<Request>();
    try {
      return of(
        await lastValueFrom(next.handle(), { defaultValue: undefined }),
      );
    } finally {
      const files = Array.isArray(request.files) ? request.files : [];
      await Promise.all(
        files.map((file) =>
          rm(file.path, { force: true }).catch((error: unknown) =>
            this.logger.warn(
              `임시 파일 삭제 실패 ${error instanceof Error && 'code' in error ? String(error.code) : ''}`.trim(),
            ),
          ),
        ),
      );
    }
  }
}
