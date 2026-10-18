import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../../../src/app.module';
import { SessionConfig } from '../../../src/auth/config/session.config';
import { RoomRepository } from '../../../src/pomodoro/repository/room.repository';
import { Room } from '../../../src/pomodoro/domain/room.entity';

describe('SessionGuard', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

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
