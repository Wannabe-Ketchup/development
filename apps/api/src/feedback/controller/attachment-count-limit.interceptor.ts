import {
  BadRequestException,
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  PayloadTooLargeException,
} from '@nestjs/common';
import { catchError, Observable, throwError } from 'rxjs';

// Nest가 multer의 LIMIT_FILE_COUNT를 400으로 바꾸므로 첨부 한도 계약대로 413으로 되돌린다
const TOO_MANY_FILES_MESSAGE = 'Too many files';

@Injectable()
export class AttachmentCountLimitInterceptor implements NestInterceptor {
  intercept(
    _context: ExecutionContext,
    next: CallHandler,
  ): Observable<unknown> {
    return next
      .handle()
      .pipe(
        catchError((error: unknown) =>
          throwError(() =>
            error instanceof BadRequestException &&
            error.message === TOO_MANY_FILES_MESSAGE
              ? new PayloadTooLargeException(TOO_MANY_FILES_MESSAGE)
              : error,
          ),
        ),
      );
  }
}
