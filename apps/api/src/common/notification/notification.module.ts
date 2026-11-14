import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Clock } from '../clock/clock';
import { SystemClock } from '../clock/system.clock';
import { NotificationSender } from './notification-sender';
import { DiscordNotificationSender } from './discord.notification-sender';

// @NotifyDiscord의 Interceptor는 핸들러가 속한 모듈에서 의존성을 찾으므로 전역으로 둔다.
@Global()
@Module({
  // ConfigService를 직접 import해, AppModule 없이 모듈을 구성하는 통합 테스트에서도 해석된다.
  imports: [ConfigModule],
  providers: [
    { provide: Clock, useClass: SystemClock },
    { provide: NotificationSender, useClass: DiscordNotificationSender },
  ],
  exports: [NotificationSender],
})
export class NotificationModule {}
