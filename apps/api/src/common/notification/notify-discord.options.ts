import type { Request } from 'express';
import type { NotificationField } from './notification';

export const NOTIFY_DISCORD_KEY = 'notifyDiscord';

export interface NotifyDiscordOptions<TResponse = unknown> {
  readonly title: string;
  // 핸들러 응답과 요청으로 필드를 만든다. 개인정보·비밀값은 넣지 않는다.
  readonly fields?: (
    response: TResponse,
    request: Request,
  ) => NotificationField[];
}
