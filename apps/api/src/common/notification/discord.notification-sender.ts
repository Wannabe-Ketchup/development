import { BadGatewayException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Clock } from '../clock/clock';
import type { Notification } from './notification';
import { NotificationSender } from './notification-sender';

const DISCORD_WEBHOOK_TIMEOUT_MS = 3_000;
const DISCORD_TITLE_MAX_LENGTH = 256;
const DISCORD_FIELD_NAME_MAX_LENGTH = 256;
const DISCORD_FIELD_VALUE_MAX_LENGTH = 1024;
const DISCORD_MAX_FIELDS = 25;

// production에서 웹훅 URL이 있을 때만 보낸다. 그 밖의 환경(dev, test, staging)에서는 아무것도 하지 않는다.
@Injectable()
export class DiscordNotificationSender extends NotificationSender {
  private readonly logger = new Logger(DiscordNotificationSender.name);
  private readonly webhookUrl: string | undefined;

  constructor(
    configService: ConfigService,
    private readonly clock: Clock,
  ) {
    super();
    const isProduction = configService.get<string>('NODE_ENV') === 'production';
    const url = configService.get<string>('DISCORD_WEBHOOK_URL')?.trim();
    this.webhookUrl = isProduction && url ? url : undefined;
    if (isProduction && !url) {
      this.logger.warn(
        'DISCORD_WEBHOOK_URL이 없어 디스코드 알림을 보내지 않습니다.',
      );
    }
  }

  async send(notification: Notification): Promise<void> {
    if (!this.webhookUrl) return;

    const response = await fetch(this.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(this.toPayload(notification)),
      signal: AbortSignal.timeout(DISCORD_WEBHOOK_TIMEOUT_MS),
      redirect: 'error',
    });
    if (!response.ok) {
      // URL·응답 본문은 비밀값을 담을 수 있어 메시지에 넣지 않는다.
      throw new BadGatewayException(
        `디스코드 알림 전송에 실패했습니다. (status: ${response.status})`,
      );
    }
  }

  private toPayload(notification: Notification) {
    return {
      allowed_mentions: { parse: [] },
      embeds: [
        {
          title: notification.title.slice(0, DISCORD_TITLE_MAX_LENGTH),
          fields: notification.fields
            .slice(0, DISCORD_MAX_FIELDS)
            .map((field) => ({
              name: field.name.slice(0, DISCORD_FIELD_NAME_MAX_LENGTH),
              value: field.value.slice(0, DISCORD_FIELD_VALUE_MAX_LENGTH),
            })),
          timestamp: this.clock.now().toISOString(),
        },
      ],
    };
  }
}
