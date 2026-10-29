import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { SessionConfig } from './../src/auth/config/session.config';
import { AppModule } from './../src/app.module';
import { RoomRepository } from './../src/pomodoro/repository/room.repository';
import { Room } from './../src/pomodoro/domain/room.entity';

describe('상태메시지 수정 (e2e)', () => {
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

  it('방의 참가자가 요청하면 204를 반환한다.', async () => {
    // given
    const roomId = 'roomId';
    app.get(RoomRepository).save(Room.create(roomId));
    const newStatusMessage = '집중 중';

    const agent = request.agent(app.getHttpServer());
    await agent.post('/auth/login/guest').expect(204);
    await agent.post(`/pomodoro/room/${roomId}/participant`).expect(201);

    // when & then
    const expectedStatus = 204;
    return agent
      .patch(`/pomodoro/room/${roomId}/participant/status-message`)
      .send({ statusMessage: newStatusMessage })
      .expect(expectedStatus);
  });

  it('존재하지 않는 방에 요청하면 404를 반환한다.', async () => {
    // given
    const unknownRoomId = 'unknownRoomId';
    const newStatusMessage = '집중 중';

    const agent = request.agent(app.getHttpServer());
    await agent.post('/auth/login/guest').expect(204);

    // when & then
    const expectedStatus = 404;
    return agent
      .patch(`/pomodoro/room/${unknownRoomId}/participant/status-message`)
      .send({ statusMessage: newStatusMessage })
      .expect(expectedStatus);
  });

  it('방에 없는 참가자로 요청하면 404를 반환한다.', async () => {
    // given
    const roomId = 'roomId';
    app.get(RoomRepository).save(Room.create(roomId));
    const newStatusMessage = '집중 중';

    const agent = request.agent(app.getHttpServer());
    await agent.post('/auth/login/guest').expect(204);

    // when & then
    const expectedStatus = 404;
    return agent
      .patch(`/pomodoro/room/${roomId}/participant/status-message`)
      .send({ statusMessage: newStatusMessage })
      .expect(expectedStatus);
  });
});
