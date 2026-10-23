import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { SessionConfig } from './../src/auth/config/session.config';
import { AppModule } from './../src/app.module';
import { RoomRepository } from './../src/pomodoro/repository/room.repository';
import { Room } from './../src/pomodoro/domain/room.entity';

describe('방 존재 확인 (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
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

  it('존재하는 방을 확인하면 200과 exists: true를 반환한다.', async () => {
    // given
    const roomId = 'roomId';
    app.get(RoomRepository).save(Room.create(roomId));

    const agent = request.agent(app.getHttpServer());
    await agent.post('/auth/login/guest').expect(204);

    // when & then
    const expectedStatus = 200;
    const expectedBody = { exists: true };
    return agent
      .get(`/pomodoro/room/${roomId}/exists`)
      .expect(expectedStatus)
      .expect(expectedBody);
  });

  it('존재하지 않는 방을 확인하면 200과 exists: false를 반환한다.', async () => {
    // given
    const unknownRoomId = 'unknownRoomId';

    const agent = request.agent(app.getHttpServer());
    await agent.post('/auth/login/guest').expect(204);

    // when & then
    const expectedStatus = 200;
    const expectedBody = { exists: false };
    return agent
      .get(`/pomodoro/room/${unknownRoomId}/exists`)
      .expect(expectedStatus)
      .expect(expectedBody);
  });
});
