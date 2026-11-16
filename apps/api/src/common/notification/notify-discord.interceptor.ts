import {
  type CallHandler,
  type ExecutionContext,
  HttpException,
  Injectable,
  Logger,
  type NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { type Observable, tap } from 'rxjs';
import { NotificationSender } from './notification-sender';
import {
  NOTIFY_DISCORD_KEY,
  type NotifyDiscordOptions,
} from './notify-discord.options';

@Injectable()
export class NotifyDiscordInterceptor implements NestInterceptor {
  private readonly logger = new Logger(NotifyDiscordInterceptor.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly notificationSender: NotificationSender,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const options = this.reflector.get<NotifyDiscordOptions | undefined>(
      NOTIFY_DISCORD_KEY,
      context.getHandler(),
    );
    if (!options) return next.handle();

    const request = context.switchToHttp().getRequest<Request>();
    return next
      .handle()
      .pipe(tap((response) => this.notify(options, response, request)));
  }

  // 알림은 부가 기능이다. 알림을 만들거나 보내다 실패해도 응답에 영향을 주지 않도록 전송은 기다리지 않는다.
  private notify(
    options: NotifyDiscordOptions,
    response: unknown,
    request: Request,
  ): void {
    try {
      const fields = options.fields?.(response, request) ?? [];
      this.notificationSender
        .send({ title: options.title, fields })
        .catch((error: unknown) => this.warn(error));
    } catch (error) {
      this.warn(error);
    }
  }

  // fetch 에러의 message·cause에는 웹훅 URL이 들어갈 수 있어 이름만 남긴다.
  private warn(error: unknown): void {
    const reason =
      error instanceof HttpException
        ? error.message
        : error instanceof Error
          ? error.name
          : 'unknown';
    this.logger.warn(`디스코드 알림을 보내지 못했습니다. (${reason})`);
  }
}
