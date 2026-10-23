import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  BREAK_DURATION_SECONDS,
  FOCUS_DURATION_SECONDS,
} from '@pomodoro/shared';
import { InMemoryTimerScheduler } from '../../../src/pomodoro/scheduler/in-memory.timer.scheduler';
import { TimerKey } from '../../../src/pomodoro/scheduler/timer.scheduler';
import { TIMER_EVENT } from '../../../src/pomodoro/constant/timer-event.constant';

const MS_PER_SECOND = 1000;
const PRESENCE_TIMEOUT_SECONDS = 5;

describe('InMemoryTimerScheduler', () => {
  const roomId = 'room-1';
  const participantId = 'participant-1';
  const sessionKey = TimerKey.session(roomId);
  const presenceKey = TimerKey.presence(roomId, participantId);

  let emit: jest.Mock;
  let scheduler: InMemoryTimerScheduler;

  const advanceSeconds = (seconds: number) =>
    jest.advanceTimersByTime(seconds * MS_PER_SECOND);

  beforeEach(() => {
    jest.useFakeTimers();

    emit = jest.fn();
    scheduler = new InMemoryTimerScheduler({
      emit,
    } as unknown as EventEmitter2);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('예약한 시간이 지나면 등록한 이벤트를 payload와 함께 발행한다', () => {
    // given
    scheduler.register(
      sessionKey,
      TIMER_EVENT.FOCUS_TIMEOUT,
      { roomId },
      FOCUS_DURATION_SECONDS,
    );

    // when
    advanceSeconds(FOCUS_DURATION_SECONDS);

    // then
    expect(emit).toHaveBeenCalledTimes(1);
    expect(emit).toHaveBeenCalledWith(TIMER_EVENT.FOCUS_TIMEOUT, { roomId });
  });

  it('예약한 시간이 되기 전에는 이벤트를 발행하지 않는다', () => {
    // given
    scheduler.register(
      sessionKey,
      TIMER_EVENT.FOCUS_TIMEOUT,
      { roomId },
      FOCUS_DURATION_SECONDS,
    );

    // when
    jest.advanceTimersByTime(FOCUS_DURATION_SECONDS * MS_PER_SECOND - 1);

    // then
    expect(emit).not.toHaveBeenCalled();
  });

  it('취소한 타이머는 시간이 지나도 이벤트를 발행하지 않는다', () => {
    // given
    scheduler.register(
      sessionKey,
      TIMER_EVENT.FOCUS_TIMEOUT,
      { roomId },
      FOCUS_DURATION_SECONDS,
    );
    scheduler.cancel(sessionKey);

    // when
    advanceSeconds(FOCUS_DURATION_SECONDS);

    // then
    expect(emit).not.toHaveBeenCalled();
  });

  it('같은 key로 다시 등록하면 이전 예약은 사라지고 새 예약만 발행된다', () => {
    // given
    scheduler.register(
      sessionKey,
      TIMER_EVENT.FOCUS_TIMEOUT,
      { roomId },
      FOCUS_DURATION_SECONDS,
    );
    scheduler.register(
      sessionKey,
      TIMER_EVENT.BREAK_TIMEOUT,
      { roomId },
      BREAK_DURATION_SECONDS,
    );

    // when
    advanceSeconds(FOCUS_DURATION_SECONDS);

    // then
    expect(emit).toHaveBeenCalledTimes(1);
    expect(emit).toHaveBeenCalledWith(TIMER_EVENT.BREAK_TIMEOUT, { roomId });
  });

  it('서로 다른 key의 타이머는 서로 영향을 주지 않는다', () => {
    // given
    scheduler.register(
      sessionKey,
      TIMER_EVENT.FOCUS_TIMEOUT,
      { roomId },
      FOCUS_DURATION_SECONDS,
    );
    scheduler.register(
      presenceKey,
      TIMER_EVENT.PRESENCE_TIMEOUT,
      { roomId, participantId },
      PRESENCE_TIMEOUT_SECONDS,
    );
    scheduler.cancel(presenceKey);

    // when
    advanceSeconds(FOCUS_DURATION_SECONDS);

    // then
    expect(emit).toHaveBeenCalledTimes(1);
    expect(emit).toHaveBeenCalledWith(TIMER_EVENT.FOCUS_TIMEOUT, { roomId });
  });

  it('예약되지 않은 key를 취소해도 아무 일도 일어나지 않는다', () => {
    // when & then
    expect(() => scheduler.cancel(sessionKey)).not.toThrow();
    expect(emit).not.toHaveBeenCalled();
  });

  it('만료 이벤트를 처리하면서 같은 key로 다시 건 타이머는 취소할 수 있다', () => {
    // given: 집중 만료 리스너가 같은 세션 key로 휴식 타이머를 다시 거는 흐름
    emit.mockImplementation((eventName: string) => {
      if (eventName === TIMER_EVENT.FOCUS_TIMEOUT) {
        scheduler.register(
          sessionKey,
          TIMER_EVENT.BREAK_TIMEOUT,
          { roomId },
          BREAK_DURATION_SECONDS,
        );
      }
      return true;
    });
    scheduler.register(
      sessionKey,
      TIMER_EVENT.FOCUS_TIMEOUT,
      { roomId },
      FOCUS_DURATION_SECONDS,
    );

    // when
    advanceSeconds(FOCUS_DURATION_SECONDS);
    scheduler.cancel(sessionKey);
    advanceSeconds(BREAK_DURATION_SECONDS);

    // then
    expect(emit).toHaveBeenCalledTimes(1);
    expect(emit).not.toHaveBeenCalledWith(TIMER_EVENT.BREAK_TIMEOUT, {
      roomId,
    });
  });

  it('모듈이 종료되면 대기 중인 타이머는 더 이상 이벤트를 발행하지 않는다', () => {
    // given
    scheduler.register(
      sessionKey,
      TIMER_EVENT.FOCUS_TIMEOUT,
      { roomId },
      FOCUS_DURATION_SECONDS,
    );
    scheduler.register(
      presenceKey,
      TIMER_EVENT.PRESENCE_TIMEOUT,
      { roomId, participantId },
      PRESENCE_TIMEOUT_SECONDS,
    );

    // when
    scheduler.onModuleDestroy();
    advanceSeconds(FOCUS_DURATION_SECONDS);

    // then
    expect(emit).not.toHaveBeenCalled();
  });
});

describe('TimerKey', () => {
  const roomId = 'room-1';
  const participantId = 'participant-1';
  const otherParticipantId = 'participant-2';

  it('한 방의 세션 타이머와 참가자별 입장 대기 타이머는 서로 다른 key를 가진다', () => {
    // when
    const keys = [
      TimerKey.session(roomId),
      TimerKey.presence(roomId, participantId),
      TimerKey.presence(roomId, otherParticipantId),
    ];

    // then
    expect(new Set(keys).size).toBe(keys.length);
  });
});
