import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../../../src/app.module';
import { SessionConfig } from '../../../src/auth/config/session.config';
import { RoomRepository } from '../../../src/pomodoro/repository/room.repository';
import { Room } from '../../../src/pomodoro/domain/room.entity';
import { S3Client } from '@aws-sdk/client-s3';
import { LoadS3MusicService } from '../../../src/music/service/load-s3-music.service';

describe('SessionGuard', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    // S3는 외부 시스템이라 대체한다. 실제 클라이언트는 AWS 환경변수를 요구하고, 부트스트랩 때 S3를 호출한다.
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(S3Client)
      .useValue({})
      .overrideProvider(LoadS3MusicService)
      .useValue({})
      .compile();

    app = moduleFixture.createNestApplication();
    SessionConfig.of({
      secret: 'test-session-secret',
      isProduction: false,
    }).apply(app);
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('전역 Guard', () => {
    it('로그인 세션 없이 보호된 API를 호출하면 401을 반환한다', () => {
      // when & then
      return request(app.getHttpServer()).get('/music/random').expect(401);
    });

    it('게스트 로그인으로 받은 세션으로 보호된 API를 호출하면 통과한다', async () => {
      // given
      const roomId = 'roomId';
      app.get(RoomRepository).save(Room.create(roomId));
      const agent = request.agent(app.getHttpServer());
      await agent.post('/auth/login/guest').expect(204);

      // when & then
      await agent.post(`/pomodoro/room/${roomId}/participant`).expect(201);
    });

    it('로그인 세션 없이 GET /health를 호출하면 200을 반환한다', () => {
      // when & then
      return request(app.getHttpServer()).get('/health').expect(200);
    });
  });
});
