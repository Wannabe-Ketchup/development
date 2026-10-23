import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { S3Client } from '@aws-sdk/client-s3';
import {
  BREAK_DURATION_SECONDS,
  CYCLE_COUNT,
  FOCUS_DURATION_SECONDS,
  ROOM_MODE,
  type RoomMode,
} from '@pomodoro/shared';
import { AppModule } from '../../../src/app.module';
import { SessionConfig } from '../../../src/auth/config/session.config';
import { LoadS3MusicService } from '../../../src/music/service/load-s3-music.service';
import { RoomRepository } from '../../../src/pomodoro/repository/room.repository';
import { Room } from '../../../src/pomodoro/domain/room.entity';
import { Participant } from '../../../src/pomodoro/domain/participant.entity';
import { Timer } from '../../../src/pomodoro/domain/timer.entity';

function restoreRoom(props: {
  roomId: string;
  participantIds: string[];
  mode: RoomMode;
  currentCycle: number;
  timer: Timer;
}): Room {
  return Room.restore({
    roomId: props.roomId,
    participants: props.participantIds.map((participantId) =>
      Participant.create(participantId, '케첩', '2026-10-17T08:50:00.000Z'),
    ),
    capacity: 4,
    timer: props.timer,
    mode: props.mode,
    currentCycle: props.currentCycle,
  });
}

function idleTimer(): Timer {
  return Timer.restore({
    status: 'IDLE',
    focusTimeSec: FOCUS_DURATION_SECONDS,
    breakTimeSec: BREAK_DURATION_SECONDS,
    totalCycle: CYCLE_COUNT,
    timerStartedAt: null,
    remainingTimeSec: FOCUS_DURATION_SECONDS,
  });
}

describe('PomodoroController', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    // S3는 외부 시스템이라 대체한다. 실제 클라이언트는 AWS 환경변수를 요구하고, 부트스트랩 때 S3를 호출한다.
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(S3Client)
      .useValue({})
      .overrideProvider(LoadS3MusicService)
      .useValue({})
      .compile();

    app = moduleRef.createNestApplication();
    SessionConfig.of({
      secret: 'test-session-secret',
      isProduction: false,
    }).apply(app);
    await app.init();
  });

  // 시작으로 등록된 세션 타이머는 app.close()에서 정리된다
  afterEach(async () => {
    await app.close();
  });

  describe('POST /pomodoro/room/:roomId/participant/pomodoro-start', () => {
    it('대기 중인 방의 참가자가 시작하면 204를 응답한다', async () => {
      // given
      const roomId = 'room-1';
      app.get(RoomRepository).save(
        restoreRoom({
          roomId,
          participantIds: [],
          mode: ROOM_MODE.IDLE,
          currentCycle: 0,
          timer: idleTimer(),
        }),
      );
      const agent = request.agent(app.getHttpServer());
      await agent.post('/auth/login/guest').expect(204);
      await agent.post(`/pomodoro/room/${roomId}/participant`).expect(201);

      // when & then
      await agent
        .post(`/pomodoro/room/${roomId}/participant/pomodoro-start`)
        .expect(204);
    });

    it('존재하지 않는 방이면 404를 응답한다', async () => {
      // given
      const unknownRoomId = 'unknown-room';
      const agent = request.agent(app.getHttpServer());
      await agent.post('/auth/login/guest').expect(204);

      // when & then
      await agent
        .post(`/pomodoro/room/${unknownRoomId}/participant/pomodoro-start`)
        .expect(404);
    });

    it('이미 진행 중인 방이면 409를 응답한다', async () => {
      // given
      const roomId = 'room-1';
      app.get(RoomRepository).save(
        restoreRoom({
          roomId,
          participantIds: [],
          mode: ROOM_MODE.IDLE,
          currentCycle: 0,
          timer: idleTimer(),
        }),
      );
      const agent = request.agent(app.getHttpServer());
      await agent.post('/auth/login/guest').expect(204);
      const enterResponse = await agent
        .post(`/pomodoro/room/${roomId}/participant`)
        .expect(201);
      // 세션의 참가자 id는 서버가 발급하므로 입장 응답에서 받아 진행 중인 방을 만든다
      const { participant } = enterResponse.body as {
        participant: { id: string };
      };
      app.get(RoomRepository).save(
        restoreRoom({
          roomId,
          participantIds: [participant.id],
          mode: ROOM_MODE.FOCUS,
          currentCycle: 1,
          timer: Timer.restore({
            status: 'RUNNING',
            focusTimeSec: FOCUS_DURATION_SECONDS,
            breakTimeSec: BREAK_DURATION_SECONDS,
            totalCycle: CYCLE_COUNT,
            timerStartedAt: '2026-10-17T09:00:00.000Z',
            remainingTimeSec: FOCUS_DURATION_SECONDS,
          }),
        }),
      );

      // when & then
      await agent
        .post(`/pomodoro/room/${roomId}/participant/pomodoro-start`)
        .expect(409);
    });
  });
});
