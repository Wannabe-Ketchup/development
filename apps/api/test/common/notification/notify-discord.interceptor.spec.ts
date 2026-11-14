import {
  Controller,
  INestApplication,
  NotFoundException,
  Post,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import type { Notification } from '../../../src/common/notification/notification';
import { NotificationSender } from '../../../src/common/notification/notification-sender';
import { NotifyDiscord } from '../../../src/common/notification/notify-discord.decorator';

interface FakeResponse {
  roomId: string;
}

@Controller('fake')
class FakeController {
  @Post('success')
  @NotifyDiscord<FakeResponse>({
    title: '새 방',
    fields: (response) => [{ name: '방 ID', value: response.roomId }],
  })
  success(): FakeResponse {
    return { roomId: 'room-uuid-1' };
  }

  @Post('failure')
  @NotifyDiscord<FakeResponse>({ title: '새 방' })
  failure(): FakeResponse {
    throw new NotFoundException('방이 없습니다.');
  }

  @Post('broken-fields')
  @NotifyDiscord<FakeResponse>({
    title: '새 방',
    fields: () => {
      throw new TypeError('필드를 만들 수 없습니다.');
    },
  })
  brokenFields(): FakeResponse {
    return { roomId: 'room-uuid-1' };
  }
}

class RecordingSender extends NotificationSender {
  readonly sent: Notification[] = [];

  send(notification: Notification): Promise<void> {
    this.sent.push(notification);
    return Promise.resolve();
  }
}

class RejectingSender extends NotificationSender {
  send(): Promise<void> {
    return Promise.reject(new Error('전송 실패'));
  }
}

// 영원히 끝나지 않는 전송
class PendingSender extends NotificationSender {
  send(): Promise<void> {
    return new Promise<void>(() => {});
  }
}

async function createApp(
  sender: NotificationSender,
): Promise<INestApplication<App>> {
  const moduleRef = await Test.createTestingModule({
    controllers: [FakeController],
    providers: [{ provide: NotificationSender, useValue: sender }],
  }).compile();
  const app = moduleRef.createNestApplication<INestApplication<App>>();
  await app.init();
  return app;
}

describe('NotifyDiscordInterceptor', () => {
  let app: INestApplication<App>;

  afterEach(async () => {
    await app.close();
  });

  it('핸들러가 성공하면 응답으로 만든 알림이 한 번 전송된다', async () => {
    // given
    const sender = new RecordingSender();
    app = await createApp(sender);

    // when
    await request(app.getHttpServer()).post('/fake/success').expect(201);

    // then
    expect(sender.sent).toEqual([
      { title: '새 방', fields: [{ name: '방 ID', value: 'room-uuid-1' }] },
    ]);
  });

  it('핸들러가 예외로 끝나면 알림을 보내지 않는다', async () => {
    // given
    const sender = new RecordingSender();
    app = await createApp(sender);

    // when
    await request(app.getHttpServer()).post('/fake/failure').expect(404);

    // then
    expect(sender.sent).toEqual([]);
  });

  it.each([
    {
      case: '전송 실패',
      createSender: () => new RejectingSender(),
      path: '/fake/success',
    },
    {
      case: '전송이 끝나지 않음',
      createSender: () => new PendingSender(),
      path: '/fake/success',
    },
    {
      case: '알림 필드 생성 실패',
      createSender: () => new RecordingSender(),
      path: '/fake/broken-fields',
    },
  ])('$case 응답은 그대로 나간다', async ({ createSender, path }) => {
    // given
    app = await createApp(createSender());

    // when
    const response = await request(app.getHttpServer()).post(path);

    // then
    expect(response.status).toBe(201);
    expect(response.body).toEqual({ roomId: 'room-uuid-1' });
  });
});
