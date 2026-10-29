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
import { PausePomodoroService } from '../../../src/pomodoro/service/pause-pomodoro.service';
import {
  TimerKey,
  TimerScheduler,
} from '../../../src/pomodoro/scheduler/timer.scheduler';
import { TIMER_EVENT } from '../../../src/pomodoro/constant/timer-event.constant';
import { SseService } from '../../../src/pomodoro/service/sse.service';
import { RoomRepository } from '../../../src/pomodoro/repository/room.repository';
import { Room } from '../../../src/pomodoro/domain/room.entity';
import { Participant } from '../../../src/pomodoro/domain/participant.entity';
import { Timer } from '../../../src/pomodoro/domain/timer.entity';

const MS_PER_SECOND = 1000;
const START_AT = new Date('2026-10-17T09:00:00.000Z');
const PAUSE_AT = new Date('2026-10-17T09:10:00.000Z');

class FixedClock extends Clock {
  now(): Date {
    return PAUSE_AT;
  }
}

function runningFocusRoom(roomId: string, participantId: string): Room {
  return Room.restore({
    roomId,
    participants: [
      Participant.create(participantId, '케첩', '2026-10-17T08:50:00.000Z'),
    ],
    capacity: 4,
    timer: Timer.restore({
      status: 'RUNNING',
      focusTimeSec: FOCUS_DURATION_SECONDS,
      breakTimeSec: BREAK_DURATION_SECONDS,
      totalCycle: CYCLE_COUNT,
      timerStartedAt: START_AT.toISOString(),
      remainingTimeSec: FOCUS_DURATION_SECONDS,
    }),
    mode: ROOM_MODE.FOCUS,
    currentCycle: 1,
  });
}

describe('PausePomodoroService', () => {
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

  describe('pausePomodoro', () => {
    it('일시정지하면 저장소의 타이머가 일시정지로 남고 방 구독자에게 방 상태가 전달된다', () => {
      // given
      const roomId = 'room-1';
      const participantId = 'participant-1';
      const roomRepository = moduleRef.get(RoomRepository);
      roomRepository.save(runningFocusRoom(roomId, participantId));
      const publishedStates: RoomState[] = [];
      moduleRef
        .get(SseService)
        .subscribe(roomId)
        .subscribe((message) =>
          publishedStates.push(message.data as RoomState),
        );

      // when
      moduleRef.get(PausePomodoroService).pausePomodoro(roomId, participantId);

      // then
      const savedRoom = roomRepository.findById(roomId);
      expect(savedRoom?.timer.status).toBe('PAUSED');
      expect(savedRoom?.timer.remainingTimeSec).toBe(
        FOCUS_DURATION_SECONDS - 600,
      );
      expect(publishedStates).toHaveLength(1);
      expect(publishedStates[0].timer.status).toBe('PAUSED');
    });

    it('일시정지하면 집중 종료 예정 시각이 지나도 방이 휴식으로 바뀌지 않는다', () => {
      // given
      const roomId = 'room-1';
      const participantId = 'participant-1';
      const roomRepository = moduleRef.get(RoomRepository);
      roomRepository.save(runningFocusRoom(roomId, participantId));
      // 시작 시각 09:00 기준, 일시정지 시각(09:10)에 남은 시간으로 등록되어 있던 만료 타이머
      moduleRef
        .get(TimerScheduler)
        .register(
          TimerKey.session(roomId),
          TIMER_EVENT.FOCUS_TIMEOUT,
          { roomId },
          FOCUS_DURATION_SECONDS - 600,
        );

      // when
      moduleRef.get(PausePomodoroService).pausePomodoro(roomId, participantId);
      jest.advanceTimersByTime(FOCUS_DURATION_SECONDS * MS_PER_SECOND);

      // then
      expect(roomRepository.findById(roomId)?.mode).toBe(ROOM_MODE.FOCUS);
    });
  });
});
