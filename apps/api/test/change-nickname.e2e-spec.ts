import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { RoomRepository } from './../src/pomodoro/repository/room.repository';
import { Room } from './../src/pomodoro/domain/room.entity';
import { Participant } from './../src/pomodoro/domain/participant.entity';

describe('닉네임 수정 (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('유효한 닉네임으로 요청하면 204를 반환한다.', () => {
    // given
    const roomId = 'roomId';
    const participantId = 'A';
    const joinedAt = '2026-09-02T00:00:00.000Z';
    const room = Room.create(roomId);
    room.join(Participant.create(participantId, '케첩', joinedAt));
    app.get(RoomRepository).save(room);
    const newNickname = '마요';

    // when & then
    const expectedStatus = 204;
    return request(app.getHttpServer())
      .patch(`/pomodoro/room/${roomId}/participant/${participantId}/nickname`)
      .send({ nickname: newNickname })
      .expect(expectedStatus);
  });

  it('형식에 맞지 않는 닉네임으로 요청하면 400을 반환한다.', () => {
    // given
    const roomId = 'roomId';
    const participantId = 'A';
    const joinedAt = '2026-09-02T00:00:00.000Z';
    const room = Room.create(roomId);
    room.join(Participant.create(participantId, '케첩', joinedAt));
    app.get(RoomRepository).save(room);
    const invalidNickname = '토마토🍅';

    // when & then
    const expectedStatus = 400;
    return request(app.getHttpServer())
      .patch(`/pomodoro/room/${roomId}/participant/${participantId}/nickname`)
      .send({ nickname: invalidNickname })
      .expect(expectedStatus);
  });

  it('존재하지 않는 방에 요청하면 404를 반환한다.', () => {
    // given
    const unknownRoomId = 'unknownRoomId';
    const participantId = 'A';
    const newNickname = '마요';

    // when & then
    const expectedStatus = 404;
    return request(app.getHttpServer())
      .patch(
        `/pomodoro/room/${unknownRoomId}/participant/${participantId}/nickname`,
      )
      .send({ nickname: newNickname })
      .expect(expectedStatus);
  });

  it('방에 없는 참가자로 요청하면 404를 반환한다.', () => {
    // given
    const roomId = 'roomId';
    const joinedAt = '2026-09-02T00:00:00.000Z';
    const room = Room.create(roomId);
    room.join(Participant.create('A', '케첩', joinedAt));
    app.get(RoomRepository).save(room);
    const unknownParticipantId = 'unknownParticipantId';
    const newNickname = '마요';

    // when & then
    const expectedStatus = 404;
    return request(app.getHttpServer())
      .patch(
        `/pomodoro/room/${roomId}/participant/${unknownParticipantId}/nickname`,
      )
      .send({ nickname: newNickname })
      .expect(expectedStatus);
  });
});
