import { Catch, ArgumentsHost, HttpException, Logger } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';

@Catch(HttpException)
export class HttpExceptionLoggerFilter extends BaseExceptionFilter {
  private readonly logger = new Logger(HttpExceptionLoggerFilter.name);

  catch(exception: HttpException, host: ArgumentsHost): void {
    const status = exception.getStatus();

    const logMessage = `${exception.message}\n${exception.stack}`;

    if (status >= 400 && status < 500) {
      this.logger.warn(logMessage);
    } else if (status >= 500) {
      this.logger.error(logMessage);
    }

    // BaseExceptionFilter가 예외 처리
    super.catch(exception, host);
  }
}
