import { Injectable } from '@nestjs/common';
import { EventEmitterModule, OnEvent } from '@nestjs/event-emitter';
import { Test, TestingModule } from '@nestjs/testing';
import { FOCUS_DURATION_SECONDS } from '@pomodoro/shared';
import { PomodoroModule } from '../../../src/pomodoro/pomodoro.module';
import {
  TimerKey,
  TimerScheduler,
} from '../../../src/pomodoro/scheduler/timer.scheduler';
import { InMemoryTimerScheduler } from '../../../src/pomodoro/scheduler/in-memory.timer.scheduler';
import {
  TIMER_EVENT,
  TimerEventPayload,
} from '../../../src/pomodoro/constant/timer-event.constant';

const MS_PER_SECOND = 1000;

type RoomTimeoutPayload = TimerEventPayload[typeof TIMER_EVENT.FOCUS_TIMEOUT];

@Injectable()
class TimerEventRecorder {
  readonly focusTimeouts: RoomTimeoutPayload[] = [];
  readonly breakTimeouts: RoomTimeoutPayload[] = [];

  @OnEvent(TIMER_EVENT.FOCUS_TIMEOUT)
  onFocusTimeout(payload: RoomTimeoutPayload): void {
    this.focusTimeouts.push(payload);
  }

  @OnEvent(TIMER_EVENT.BREAK_TIMEOUT)
  onBreakTimeout(payload: RoomTimeoutPayload): void {
    this.breakTimeouts.push(payload);
  }
}

describe('TimerScheduler + EventEmitter 통합', () => {
  const roomId = 'room-1';

  let moduleRef: TestingModule;
  let scheduler: TimerScheduler;
  let recorder: TimerEventRecorder;

  beforeEach(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [EventEmitterModule.forRoot(), PomodoroModule],
      providers: [TimerEventRecorder],
    }).compile();
    await moduleRef.init();

    scheduler = moduleRef.get(TimerScheduler);
    recorder = moduleRef.get(TimerEventRecorder);

    // Nest 초기화가 끝난 뒤 가짜 타이머로 바꾼다.
    jest.useFakeTimers();
  });

  afterEach(async () => {
    jest.useRealTimers();
    await moduleRef.close();
  });

  it('PomodoroModule은 타이머 스케줄러로 인메모리 구현체를 주입한다', () => {
    // then
    expect(scheduler).toBeInstanceOf(InMemoryTimerScheduler);
  });

  it('예약한 시간이 지나면 해당 이벤트를 구독한 리스너가 payload를 받는다', () => {
    // given
    scheduler.register(
      TimerKey.session(roomId),
      TIMER_EVENT.FOCUS_TIMEOUT,
      { roomId },
      FOCUS_DURATION_SECONDS,
    );

    // when
    jest.advanceTimersByTime(FOCUS_DURATION_SECONDS * MS_PER_SECOND);

    // then
    expect(recorder.focusTimeouts).toEqual([{ roomId }]);
    expect(recorder.breakTimeouts).toEqual([]);
  });
});
