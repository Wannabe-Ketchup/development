import { BadRequestException } from '@nestjs/common';
import {
  BREAK_DURATION_SECONDS,
  CYCLE_COUNT,
  FOCUS_DURATION_SECONDS,
  type TimerStatus,
} from '@pomodoro/shared';
import { Timer } from '../../../src/pomodoro/domain/timer.entity';

describe('Timer', () => {
  describe('of', () => {
    it.each<{ status: TimerStatus; timerStartedAt: string | null }>([
      { status: 'RUNNING', timerStartedAt: null },
      { status: 'IDLE', timerStartedAt: '2026-10-17T09:00:00.000Z' },
    ])(
      '진행 중인데 시작 시각이 없거나, 대기 중인데 시작 시각이 있는 타이머는 만들 수 없다 ($status, 시작 시각 $timerStartedAt)',
      ({ status, timerStartedAt }) => {
        // when & then
        expect(() =>
          Timer.of({
            status,
            focusTimeSec: FOCUS_DURATION_SECONDS,
            breakTimeSec: BREAK_DURATION_SECONDS,
            totalCycle: CYCLE_COUNT,
            timerStartedAt,
            remainingTimeSec: FOCUS_DURATION_SECONDS,
          }),
        ).toThrow(BadRequestException);
      },
    );
  });
});
