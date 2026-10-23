import { EventEmitterModule } from '@nestjs/event-emitter';
import { Test, TestingModule } from '@nestjs/testing';
import {
  BREAK_DURATION_SECONDS,
  CYCLE_COUNT,
  FOCUS_DURATION_SECONDS,
  ROOM_MODE,
  type Room as RoomState,
} from '@pomodoro/shared';
import { Clock } from '../../../src/common/clock/clock';
import { PomodoroModule } from '../../../src/pomodoro/pomodoro.module';
import { StartPomodoroService } from '../../../src/pomodoro/service/start-pomodoro.service';
import { SseService } from '../../../src/pomodoro/service/sse.service';
import { RoomRepository } from '../../../src/pomodoro/repository/room.repository';
import { Room } from '../../../src/pomodoro/domain/room.entity';
import { Participant } from '../../../src/pomodoro/domain/participant.entity';
import { Timer } from '../../../src/pomodoro/domain/timer.entity';

const MS_PER_SECOND = 1000;
const NOW = new Date('2026-10-17T09:00:00.000Z');

class FixedClock extends Clock {
  now(): Date {
    return NOW;
  }
}

function idleRoom(roomId: string, participantId: string): Room {
  return Room.restore({
    roomId,
    participants: [
      Participant.create(participantId, '케첩', '2026-10-17T08:50:00.000Z'),
    ],
    capacity: 4,
    timer: Timer.restore({
      status: 'IDLE',
      focusTimeSec: FOCUS_DURATION_SECONDS,
      breakTimeSec: BREAK_DURATION_SECONDS,
      totalCycle: CYCLE_COUNT,
      timerStartedAt: null,
      remainingTimeSec: FOCUS_DURATION_SECONDS,
    }),
    mode: ROOM_MODE.IDLE,
    currentCycle: 0,
  });
}

describe('StartPomodoroService', () => {
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

  describe('startPomodoro', () => {
    it('뽀모도로를 시작하면 저장소의 방이 1회차 집중으로 남고 방 구독자에게 방 상태가 전달된다', () => {
      // given
      const roomId = 'room-1';
      const participantId = 'participant-1';
      const roomRepository = moduleRef.get(RoomRepository);
      roomRepository.save(idleRoom(roomId, participantId));
      const publishedStates: RoomState[] = [];
      moduleRef
        .get(SseService)
        .subscribe(roomId)
        .subscribe((message) =>
          publishedStates.push(message.data as RoomState),
        );

      // when
      moduleRef.get(StartPomodoroService).startPomodoro(roomId, participantId);

      // then
      const savedRoom = roomRepository.findById(roomId);
      expect(savedRoom?.mode).toBe(ROOM_MODE.FOCUS);
      expect(savedRoom?.currentCycle).toBe(1);
      expect(publishedStates).toHaveLength(1);
      expect(publishedStates[0].mode).toBe(ROOM_MODE.FOCUS);
      expect(publishedStates[0].currentCycle).toBe(1);
    });

    it('시작 후 집중 시간이 지나면 저장소의 방이 1회차 휴식으로 바뀐다', () => {
      // given
      const roomId = 'room-1';
      const participantId = 'participant-1';
      const roomRepository = moduleRef.get(RoomRepository);
      roomRepository.save(idleRoom(roomId, participantId));

      // when
      moduleRef.get(StartPomodoroService).startPomodoro(roomId, participantId);
      jest.advanceTimersByTime(FOCUS_DURATION_SECONDS * MS_PER_SECOND);

      // then
      const savedRoom = roomRepository.findById(roomId);
      expect(savedRoom?.mode).toBe(ROOM_MODE.BREAK);
      expect(savedRoom?.currentCycle).toBe(1);
    });
  });
});
