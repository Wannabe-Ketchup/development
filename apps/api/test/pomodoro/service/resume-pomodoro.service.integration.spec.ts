import { EventEmitterModule } from '@nestjs/event-emitter';
import { Test, TestingModule } from '@nestjs/testing';
import {
  BREAK_DURATION_SECONDS,
  CYCLE_COUNT,
  FOCUS_DURATION_SECONDS,
  ROOM_MODE,
  type Room as RoomState,
  type RoomMode,
} from '@pomodoro/shared';
import { Clock } from '../../../src/common/clock/clock';
import { PomodoroModule } from '../../../src/pomodoro/pomodoro.module';
import { ResumePomodoroService } from '../../../src/pomodoro/service/resume-pomodoro.service';
import { SseService } from '../../../src/pomodoro/service/sse.service';
import { RoomRepository } from '../../../src/pomodoro/repository/room.repository';
import { Room } from '../../../src/pomodoro/domain/room.entity';
import { Participant } from '../../../src/pomodoro/domain/participant.entity';
import { Timer } from '../../../src/pomodoro/domain/timer.entity';

const MS_PER_SECOND = 1000;
const NOW = new Date('2026-10-17T09:00:00.000Z');
const PAUSED_REMAINING_SEC = 120;

class FixedClock extends Clock {
  now(): Date {
    return NOW;
  }
}

function pausedRoom(
  roomId: string,
  participantId: string,
  mode: RoomMode,
  currentCycle: number,
): Room {
  return Room.restore({
    roomId,
    participants: [
      Participant.create(participantId, '케첩', '2026-10-17T08:50:00.000Z'),
    ],
    capacity: 4,
    timer: Timer.restore({
      status: 'PAUSED',
      focusTimeSec: FOCUS_DURATION_SECONDS,
      breakTimeSec: BREAK_DURATION_SECONDS,
      totalCycle: CYCLE_COUNT,
      timerStartedAt: null,
      remainingTimeSec: PAUSED_REMAINING_SEC,
    }),
    mode,
    currentCycle,
  });
}

describe('ResumePomodoroService', () => {
  let moduleRef: TestingModule;

  beforeEach(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [EventEmitterModule.forRoot(), PomodoroModule],
    })
      .overrideProvider(Clock)
      .useClass(FixedClock)
      .compile();
    await moduleRef.init();

    // Nest 초기화가 끝난 뒤 가짜 타이머로 바꾼다.
    jest.useFakeTimers();
  });

  afterEach(async () => {
    jest.useRealTimers();
    await moduleRef.close();
  });

  describe('resumePomodoro', () => {
    it('재개하면 저장소의 타이머가 진행 중으로 남고 방 구독자에게 방 상태가 전달된다', () => {
      // given
      const roomId = 'room-1';
      const participantId = 'participant-1';
      const roomRepository = moduleRef.get(RoomRepository);
      roomRepository.save(
        pausedRoom(roomId, participantId, ROOM_MODE.FOCUS, 1),
      );
      const publishedStates: RoomState[] = [];
      moduleRef
        .get(SseService)
        .subscribe(roomId)
        .subscribe((message) =>
          publishedStates.push(message.data as RoomState),
        );

      // when
      moduleRef
        .get(ResumePomodoroService)
        .resumePomodoro(roomId, participantId);

      // then
      const savedRoom = roomRepository.findById(roomId);
      expect(savedRoom?.timer.status).toBe('RUNNING');
      expect(savedRoom?.timer.timerStartedAt).toBe(NOW.toISOString());
      expect(savedRoom?.timer.remainingTimeSec).toBe(PAUSED_REMAINING_SEC);
      expect(publishedStates).toHaveLength(1);
      expect(publishedStates[0].timer.status).toBe('RUNNING');
    });

    it.each([
      {
        mode: ROOM_MODE.FOCUS,
        nextMode: ROOM_MODE.BREAK,
        currentCycle: 1,
        nextCycle: 1,
      },
      {
        mode: ROOM_MODE.BREAK,
        nextMode: ROOM_MODE.FOCUS,
        currentCycle: 1,
        nextCycle: 2,
      },
    ])(
      '$mode 중 재개하면 멈춘 남은 시간이 지난 뒤 $nextMode로 바뀐다',
      ({ mode, nextMode, currentCycle, nextCycle }) => {
        // given
        const roomId = 'room-1';
        const participantId = 'participant-1';
        const roomRepository = moduleRef.get(RoomRepository);
        roomRepository.save(
          pausedRoom(roomId, participantId, mode, currentCycle),
        );

        // when
        moduleRef
          .get(ResumePomodoroService)
          .resumePomodoro(roomId, participantId);
        jest.advanceTimersByTime(PAUSED_REMAINING_SEC * MS_PER_SECOND);

        // then
        const savedRoom = roomRepository.findById(roomId);
        expect(savedRoom?.mode).toBe(nextMode);
        expect(savedRoom?.currentCycle).toBe(nextCycle);
      },
    );
  });
});
