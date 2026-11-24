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
      { status: 'PAUSED', timerStartedAt: '2026-10-17T09:00:00.000Z' },
    ])(
      '진행 중인데 시작 시각이 없거나, 대기·일시정지 중인데 시작 시각이 있는 타이머는 만들 수 없다 ($status, 시작 시각 $timerStartedAt)',
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

  describe('changeDuration', () => {
    it('집중·휴식 시간을 바꾸면 분이 초로 저장되고 대기 화면의 남은 시간도 새 집중 시간이 된다', () => {
      // given
      const timer = Timer.restore({
        status: 'IDLE',
        focusTimeSec: FOCUS_DURATION_SECONDS,
        breakTimeSec: BREAK_DURATION_SECONDS,
        totalCycle: CYCLE_COUNT,
        timerStartedAt: null,
        remainingTimeSec: FOCUS_DURATION_SECONDS,
      });

      // when
      const changed = timer.changeDuration(30, 10);

      // then
      expect(changed.focusTimeSec).toBe(1800);
      expect(changed.breakTimeSec).toBe(600);
      expect(changed.remainingTimeSec).toBe(1800);
    });

    it.each([
      { focusMinutes: 10, breakMinutes: 1 },
      { focusMinutes: 60, breakMinutes: 20 },
    ])(
      '집중 $focusMinutes분, 휴식 $breakMinutes분은 설정할 수 있다',
      ({ focusMinutes, breakMinutes }) => {
        // given
        const timer = Timer.restore({
          status: 'IDLE',
          focusTimeSec: FOCUS_DURATION_SECONDS,
          breakTimeSec: BREAK_DURATION_SECONDS,
          totalCycle: CYCLE_COUNT,
          timerStartedAt: null,
          remainingTimeSec: FOCUS_DURATION_SECONDS,
        });

        // when
        const changed = timer.changeDuration(focusMinutes, breakMinutes);

        // then
        expect(changed.focusTimeSec).toBe(focusMinutes * 60);
        expect(changed.breakTimeSec).toBe(breakMinutes * 60);
      },
    );

    it.each<{ focusMinutes: unknown; breakMinutes: unknown }>([
      { focusMinutes: 5, breakMinutes: 5 },
      { focusMinutes: 65, breakMinutes: 5 },
      { focusMinutes: 12, breakMinutes: 5 },
      { focusMinutes: '25', breakMinutes: 5 },
      { focusMinutes: 25, breakMinutes: 0 },
      { focusMinutes: 25, breakMinutes: 21 },
      { focusMinutes: 25, breakMinutes: 1.5 },
    ])(
      '범위 밖이거나 단위에 맞지 않는 시간은 설정할 수 없다 (집중 $focusMinutes, 휴식 $breakMinutes)',
      ({ focusMinutes, breakMinutes }) => {
        // given
        const timer = Timer.restore({
          status: 'IDLE',
          focusTimeSec: FOCUS_DURATION_SECONDS,
          breakTimeSec: BREAK_DURATION_SECONDS,
          totalCycle: CYCLE_COUNT,
          timerStartedAt: null,
          remainingTimeSec: FOCUS_DURATION_SECONDS,
        });

        // when & then
        expect(() =>
          timer.changeDuration(focusMinutes as number, breakMinutes as number),
        ).toThrow(BadRequestException);
      },
    );
  });
});
