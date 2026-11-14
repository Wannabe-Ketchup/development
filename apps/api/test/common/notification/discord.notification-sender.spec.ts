import { BadGatewayException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { Clock } from '../../../src/common/clock/clock';
import { DiscordNotificationSender } from '../../../src/common/notification/discord.notification-sender';

const NOW = new Date('2026-11-14T03:00:00.000Z');
const WEBHOOK_URL = 'https://discord.com/api/webhooks/0/dummy-token';

class FixedClock extends Clock {
  now(): Date {
    return NOW;
  }
}

async function createSender(
  env: Record<string, string>,
): Promise<DiscordNotificationSender> {
  const moduleRef = await Test.createTestingModule({
    providers: [
      DiscordNotificationSender,
      { provide: ConfigService, useValue: new ConfigService(env) },
      { provide: Clock, useClass: FixedClock },
    ],
  }).compile();
  return moduleRef.get(DiscordNotificationSender);
}

describe('DiscordNotificationSender', () => {
  let fetchSpy: jest.SpyInstance;

  beforeEach(() => {
    fetchSpy = jest
      .spyOn(global, 'fetch')
      .mockResolvedValue(new Response(null, { status: 204 }));
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('send', () => {
    it('production에서 웹훅 URL이 있으면 멘션을 막은 embed로 웹훅을 호출한다', async () => {
      // given
      const sender = await createSender({
        NODE_ENV: 'production',
        DISCORD_WEBHOOK_URL: WEBHOOK_URL,
      });

      // when
      await sender.send({
        title: '새 뽀모도로 방이 만들어졌습니다',
        fields: [{ name: '방 ID', value: 'room-uuid-1' }],
      });

      // then
      expect(fetchSpy).toHaveBeenCalledTimes(1);
      const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
      expect(url).toBe(WEBHOOK_URL);
      expect(JSON.parse(init.body as string)).toEqual({
        allowed_mentions: { parse: [] },
        embeds: [
          {
            title: '새 뽀모도로 방이 만들어졌습니다',
            fields: [{ name: '방 ID', value: 'room-uuid-1' }],
            timestamp: '2026-11-14T03:00:00.000Z',
          },
        ],
      });
    });

    it.each([
      {
        case: 'NODE_ENV=dev이면',
        env: { NODE_ENV: 'dev', DISCORD_WEBHOOK_URL: WEBHOOK_URL },
      },
      {
        case: 'NODE_ENV=test이면',
        env: { NODE_ENV: 'test', DISCORD_WEBHOOK_URL: WEBHOOK_URL },
      },
      {
        case: 'NODE_ENV=staging이면',
        env: { NODE_ENV: 'staging', DISCORD_WEBHOOK_URL: WEBHOOK_URL },
      },
      {
        case: 'production인데 웹훅 URL이 없으면',
        env: { NODE_ENV: 'production' },
      },
    ])('$case 웹훅을 호출하지 않는다', async ({ env }) => {
      // given
      const sender = await createSender(env);

      // when
      await sender.send({
        title: '새 뽀모도로 방이 만들어졌습니다',
        fields: [],
      });

      // then
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('디스코드가 실패 status로 응답하면 웹훅 URL이 담기지 않은 예외로 알린다', async () => {
      // given
      fetchSpy.mockResolvedValue(new Response(null, { status: 429 }));
      const sender = await createSender({
        NODE_ENV: 'production',
        DISCORD_WEBHOOK_URL: WEBHOOK_URL,
      });

      // when
      const result = sender.send({ title: '알림', fields: [] });

      // then
      await expect(result).rejects.toThrow(BadGatewayException);
      await expect(result).rejects.not.toThrow(WEBHOOK_URL);
      await expect(result).rejects.toThrow('429');
    });
  });
});
