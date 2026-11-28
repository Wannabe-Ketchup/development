import { INestApplication, ServiceUnavailableException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { S3Client } from '@aws-sdk/client-s3';
import request from 'supertest';
import { App } from 'supertest/types';
import { readdir } from 'node:fs/promises';
import {
  FEEDBACK_ATTACHMENT_MAX_COUNT,
  FEEDBACK_ATTACHMENT_MAX_TOTAL_BYTES,
} from '@pomodoro/shared';
import { AppModule } from '../../../src/app.module';
import { SessionConfig } from '../../../src/auth/config/session.config';
import { Clock } from '../../../src/common/clock/clock';
import { FEEDBACK_UPLOAD_DIRECTORY } from '../../../src/feedback/config/feedback-upload-directory';
import { FeedbackMailTransport } from '../../../src/feedback/config/mail-transport.provider';
import {
  DailyFeedbackQuota,
  FEEDBACK_DAILY_MAX_COUNT,
} from '../../../src/feedback/domain/daily-feedback-quota';
import { Feedback } from '../../../src/feedback/domain/feedback.entity';
import { FeedbackQuotaRepository } from '../../../src/feedback/repository/feedback-quota.repository';
import { FeedbackMailSender } from '../../../src/feedback/service/feedback-mail-sender';
import { LoadS3MusicService } from '../../../src/music/service/load-s3-music.service';
import { EXE_HEADER, PNG_HEADER } from '../attachment-headers';

const NOW = new Date('2026-11-23T03:00:00.000Z');

class FixedClock extends Clock {
  now(): Date {
    return NOW;
  }
}

class RecordingMailSender extends FeedbackMailSender {
  readonly sent: Feedback[] = [];

  send(feedback: Feedback): Promise<void> {
    this.sent.push(feedback);
    return Promise.resolve();
  }
}

class FailingMailSender extends FeedbackMailSender {
  send(): Promise<void> {
    return Promise.reject(new ServiceUnavailableException());
  }
}

describe('FeedbackController', () => {
  let app: INestApplication<App>;

  async function createApp(
    mailSender: new () => FeedbackMailSender = RecordingMailSender,
  ): Promise<INestApplication<App>> {
    // S3와 메일은 외부 시스템이라 대체한다. 실제 메일 transport는 환경변수를 요구한다.
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(S3Client)
      .useValue({})
      .overrideProvider(LoadS3MusicService)
      .useValue({})
      .overrideProvider(FeedbackMailTransport)
      .useValue({})
      .overrideProvider(FeedbackMailSender)
      .useClass(mailSender)
      .overrideProvider(Clock)
      .useClass(FixedClock)
      .compile();

    const created = moduleRef.createNestApplication<INestApplication<App>>();
    SessionConfig.of({
      secret: 'test-session-secret',
      isProduction: false,
    }).apply(created);
    await created.init();
    return created;
  }

  beforeEach(async () => {
    app = await createApp();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('POST /feedbacks', () => {
    it('내용과 이미지를 보내면 204를 응답하고 임시 파일이 남지 않는다', async () => {
      // given
      const agent = request.agent(app.getHttpServer());
      await agent.post('/auth/login/guest').expect(204);
      const image = Buffer.concat([PNG_HEADER, Buffer.alloc(100)]);

      // when
      await agent
        .post('/feedbacks')
        .field('content', '타이머가 좋아요')
        .attach('attachments', image, { filename: '결제화면.jpg' })
        .expect(204);

      // then
      const [feedback] = app.get<RecordingMailSender>(FeedbackMailSender).sent;
      expect(feedback.attachments.toArray()).toMatchObject([
        { fileName: '결제화면.png', mimeType: 'image/png' },
      ]);
      expect(await readdir(FEEDBACK_UPLOAD_DIRECTORY)).toEqual([]);
    });

    it('지원하지 않는 형식이면 400을 응답하고 임시 파일이 남지 않는다', async () => {
      // given
      const agent = request.agent(app.getHttpServer());
      await agent.post('/auth/login/guest').expect(204);
      const executable = Buffer.concat([EXE_HEADER, Buffer.alloc(100)]);

      // when
      await agent
        .post('/feedbacks')
        .field('content', '타이머가 좋아요')
        .attach('attachments', executable, { filename: 'a.png' })
        .expect(400);

      // then
      expect(await readdir(FEEDBACK_UPLOAD_DIRECTORY)).toEqual([]);
    });

    it('content가 없으면 400을 응답한다', async () => {
      // given
      const agent = request.agent(app.getHttpServer());
      await agent.post('/auth/login/guest').expect(204);

      // when & then
      await agent
        .post('/feedbacks')
        .attach('attachments', Buffer.concat([PNG_HEADER, Buffer.alloc(100)]), {
          filename: 'a.png',
        })
        .expect(400);
    });

    it('오늘 상한에 닿았으면 429를 응답한다', async () => {
      // given
      app.get(FeedbackQuotaRepository).save(
        DailyFeedbackQuota.restore({
          day: '2026-11-23',
          count: FEEDBACK_DAILY_MAX_COUNT,
          attachmentBytes: 0,
        }),
      );
      const agent = request.agent(app.getHttpServer());
      await agent.post('/auth/login/guest').expect(204);

      // when & then
      await agent
        .post('/feedbacks')
        .field('content', '타이머가 좋아요')
        .expect(429);
    });

    it('첨부가 500개를 넘으면 413을 응답한다', async () => {
      // given
      const agent = request.agent(app.getHttpServer());
      await agent.post('/auth/login/guest').expect(204);
      const image = Buffer.concat([PNG_HEADER, Buffer.alloc(10)]);
      const req = Array.from(
        { length: FEEDBACK_ATTACHMENT_MAX_COUNT + 1 },
        (_, i) => i,
      ).reduce(
        (builder, i) =>
          builder.attach('attachments', image, { filename: `a${i}.png` }),
        agent.post('/feedbacks').field('content', '타이머가 좋아요'),
      );

      // when & then
      await req.expect(413);
      expect(await readdir(FEEDBACK_UPLOAD_DIRECTORY)).toEqual([]);
    });

    it('첨부 합계가 18,000,000바이트를 넘으면 413을 응답한다', async () => {
      // given
      const agent = request.agent(app.getHttpServer());
      await agent.post('/auth/login/guest').expect(204);
      const half = Buffer.concat([
        PNG_HEADER,
        Buffer.alloc(FEEDBACK_ATTACHMENT_MAX_TOTAL_BYTES / 2),
      ]);

      // when & then
      await agent
        .post('/feedbacks')
        .field('content', '타이머가 좋아요')
        .attach('attachments', half, { filename: 'a.png' })
        .attach('attachments', half, { filename: 'b.png' })
        .expect(413);
      expect(await readdir(FEEDBACK_UPLOAD_DIRECTORY)).toEqual([]);
    });
  });

  describe('POST /feedbacks 메일 발송 실패', () => {
    it('메일 발송에 실패하면 503을 응답한다', async () => {
      // given
      await app.close();
      app = await createApp(FailingMailSender);
      const agent = request.agent(app.getHttpServer());
      await agent.post('/auth/login/guest').expect(204);

      // when & then
      await agent
        .post('/feedbacks')
        .field('content', '타이머가 좋아요')
        .expect(503);
    });
  });
});
