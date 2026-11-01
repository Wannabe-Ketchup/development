import { ROOM_MODE } from '@pomodoro/shared';
import type { Room } from '@pomodoro/shared';
import { formatTabTitle } from './tab-title';

describe('formatTabTitle', () => {
  const FOCUS_TIME_SEC = 1500;
  const startedAt = new Date('2026-01-01T00:00:00.000Z');

  const baseTimer: Room['timer'] = {
    status: 'RUNNING',
    focusTimeSec: FOCUS_TIME_SEC,
    breakTimeSec: 300,
    totalCycle: 4,
    timerStartedAt: startedAt.toISOString(),
    remainingTimeSec: FOCUS_TIME_SEC,
  };

  it("진행 중이면 'MM:SS · 세션 라벨'을 돌려준다", () => {
    // given
    const room = {
      mode: ROOM_MODE.FOCUS,
      currentCycle: 1,
      timer: baseTimer,
    };
    const oneMinuteLater = new Date(startedAt.getTime() + 60 * 1000);

    // when
    const title = formatTabTitle(room, oneMinuteLater);

    // then
    expect(title).toBe('24:00 · 1st focus');
  });

  it('일시정지 중이면 일시정지를 돌려준다', () => {
    // given
    const room = {
      mode: ROOM_MODE.FOCUS,
      currentCycle: 1,
      timer: { ...baseTimer, status: 'PAUSED' as const },
    };

    // when
    const title = formatTabTitle(room, startedAt);

    // then
    expect(title).toBe('일시정지');
  });

  it('대기 중이면 대기 중을 돌려준다', () => {
    // given
    const room = {
      mode: ROOM_MODE.IDLE,
      currentCycle: 0,
      timer: { ...baseTimer, status: 'IDLE' as const, timerStartedAt: null },
    };

    // when
    const title = formatTabTitle(room, startedAt);

    // then
    expect(title).toBe('대기 중');
  });
});
