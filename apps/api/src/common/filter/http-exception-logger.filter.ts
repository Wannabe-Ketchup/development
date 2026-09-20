import { Catch, ArgumentsHost, HttpException, Logger } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';

@Catch(HttpException)
export class HttpExceptionLoggerFilter extends BaseExceptionFilter {
  private readonly logger = new Logger(HttpExceptionLoggerFilter.name);

  catch(exception: HttpException, host: ArgumentsHost): void {
    const status = exception.getStatus();

    // 400번대 예외에 대해 로깅
    if (status >= 400 && status < 500) {
      const logMessage = `${exception.message}\n${exception.stack}`;
      this.logger.warn(logMessage);
    }

    // BaseExceptionFilter가 예외 처리
    super.catch(exception, host);
  }
}
