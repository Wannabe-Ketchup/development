import { applyDecorators, SetMetadata, UseInterceptors } from '@nestjs/common';
import { NotifyDiscordInterceptor } from './notify-discord.interceptor';
import {
  NOTIFY_DISCORD_KEY,
  type NotifyDiscordOptions,
} from './notify-discord.options';

// 핸들러가 성공한 뒤 디스코드로 알린다. 핸들러가 예외로 끝나면 알리지 않는다.
export const NotifyDiscord = <TResponse>(
  options: NotifyDiscordOptions<TResponse>,
) =>
  applyDecorators(
    SetMetadata(NOTIFY_DISCORD_KEY, options),
    UseInterceptors(NotifyDiscordInterceptor),
  );
