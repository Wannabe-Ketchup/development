import { describe, it, expect } from 'vitest';
import type { Timer } from '@pomodoro/shared';
import { formatRemainingTime, getRemainingTimeSec } from './remaining-time';

describe('formatRemainingTime', () => {
  it('60초 미만이면 분은 0으로, 초는 그대로 두 자리로 표시한다', () => {
    expect(formatRemainingTime(25)).toBe('00 : 25');
  });

  it('분과 초 모두 두 자리로 0을 채워 표시한다', () => {
    expect(formatRemainingTime(65)).toBe('01 : 05');
  });

  it('10분 이상도 분:초 형식으로 표시한다', () => {
    expect(formatRemainingTime(745)).toBe('12 : 25');
  });
});

describe('getRemainingTimeSec', () => {
  it('타이머가 진행 중이면 시작 시각으로부터 경과한 시간만큼 남은 시간에서 뺀다', () => {
    // given
    const timer: Timer = {
      status: 'RUNNING',
      focusTimeSec: 1500,
      breakTimeSec: 300,
      totalCycle: 4,
      timerStartedAt: new Date('2026-01-01T00:00:00.000Z').toISOString(),
      remainingTimeSec: 100,
    };
    const now = new Date('2026-01-01T00:00:10.000Z');

    // when
    const result = getRemainingTimeSec(timer, now);

    // then
    expect(result).toBe(90);
  });

  it('타이머가 일시정지 상태면 저장된 남은 시간을 경과 시간 반영 없이 그대로 반환한다', () => {
    // given
    const timer: Timer = {
      status: 'PAUSED',
      focusTimeSec: 1500,
      breakTimeSec: 300,
      totalCycle: 4,
      timerStartedAt: null,
      remainingTimeSec: 100,
    };

    // when
    const result = getRemainingTimeSec(timer, new Date());

    // then
    expect(result).toBe(100);
  });

  it('타이머가 대기 상태면 설정된 집중 시간을 그대로 반환한다', () => {
    // given
    const timer: Timer = {
      status: 'IDLE',
      focusTimeSec: 1500,
      breakTimeSec: 300,
      totalCycle: 4,
      timerStartedAt: null,
      remainingTimeSec: 1500,
    };

    // when
    const result = getRemainingTimeSec(timer, new Date());

    // then
    expect(result).toBe(1500);
  });

  it('경과 시간이 남은 시간을 초과해도 결과는 0 미만으로 내려가지 않는다', () => {
    // given
    const timer: Timer = {
      status: 'RUNNING',
      focusTimeSec: 1500,
      breakTimeSec: 300,
      totalCycle: 4,
      timerStartedAt: new Date('2026-01-01T00:00:00.000Z').toISOString(),
      remainingTimeSec: 5,
    };
    const now = new Date('2026-01-01T00:00:10.000Z');

    // when
    const result = getRemainingTimeSec(timer, now);

    // then
    expect(result).toBe(0);
  });
});
