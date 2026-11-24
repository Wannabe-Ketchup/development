import { EventEmitter2, EventEmitterModule } from '@nestjs/event-emitter';
import { Test, TestingModule } from '@nestjs/testing';
import {
  BREAK_DURATION_SECONDS,
  CYCLE_COUNT,
  FOCUS_DURATION_SECONDS,
  ROOM_MODE,
  type Room as RoomState,
} from '@pomodoro/shared';
import { PomodoroModule } from '../../../src/pomodoro/pomodoro.module';
import { ResetPomodoroService } from '../../../src/pomodoro/service/reset-pomodoro.service';
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

function runningFocusRoom(roomId: string, participantId: string): Room {
  return Room.restore({
    roomId,
    participants: [
      Participant.restore({
        id: participantId,
        nickname: '케첩',
        statusMessage: '',
        completedCycles: 0,
        joinedAt: '2026-10-17T08:50:00.000Z',
      }),
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

describe('ResetPomodoroService', () => {
  let moduleRef: TestingModule;

  beforeEach(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [EventEmitterModule.forRoot(), PomodoroModule],
    }).compile();
    await moduleRef.init();

    // Nest 초기화가 끝난 뒤 가짜 타이머로 바꾼다.
    jest.useFakeTimers();
  });

  afterEach(async () => {
    jest.useRealTimers();
    await moduleRef.close();
  });

  describe('resetPomodoro', () => {
    // 예약이 남아 있어도 finishFocus가 대기 방을 거부해 상태는 그대로다. 그래서 상태가 아니라 종료 이벤트가 나지 않는 것으로 취소를 확인한다
    it('진행 중에 리셋하면 예약된 세션 종료가 취소되어 원래 종료 시각이 지나도 세션 종료가 일어나지 않고 대기 상태로 남는다', () => {
      // given
      const roomId = 'room-1';
      const participantId = 'participant-1';
      const roomRepository = moduleRef.get(RoomRepository);
      roomRepository.save(runningFocusRoom(roomId, participantId));
      moduleRef
        .get(TimerScheduler)
        .register(
          TimerKey.session(roomId),
          TIMER_EVENT.FOCUS_TIMEOUT,
          { roomId },
          FOCUS_DURATION_SECONDS,
        );
      const focusTimeouts: unknown[] = [];
      moduleRef
        .get(EventEmitter2)
        .on(TIMER_EVENT.FOCUS_TIMEOUT, (payload: unknown) =>
          focusTimeouts.push(payload),
        );

      // when
      moduleRef.get(ResetPomodoroService).resetPomodoro(roomId, participantId);
      jest.advanceTimersByTime(FOCUS_DURATION_SECONDS * MS_PER_SECOND);

      // then
      expect(focusTimeouts).toHaveLength(0);
      const savedRoom = roomRepository.findById(roomId);
      expect(savedRoom?.mode).toBe(ROOM_MODE.IDLE);
      expect(savedRoom?.currentCycle).toBe(0);
      expect(savedRoom?.timer.status).toBe('IDLE');
    });

    it('리셋하면 방 참여자에게 대기 상태가 리셋 이벤트(pomodoro_reset)로 한 번 전달된다', () => {
      // given
      const roomId = 'room-1';
      const participantId = 'participant-1';
      moduleRef
        .get(RoomRepository)
        .save(runningFocusRoom(roomId, participantId));
      const events: { type: string; data: RoomState }[] = [];
      moduleRef
        .get(SseService)
        .subscribe(roomId)
        .subscribe((message) =>
          events.push({ type: message.type, data: message.data as RoomState }),
        );

      // when
      moduleRef.get(ResetPomodoroService).resetPomodoro(roomId, participantId);

      // then
      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('pomodoro_reset');
      expect(events[0].data.mode).toBe(ROOM_MODE.IDLE);
      expect(events[0].data.timer.status).toBe('IDLE');
    });
  });
});
