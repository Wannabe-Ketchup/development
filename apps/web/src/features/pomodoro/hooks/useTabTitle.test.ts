import { renderHook } from '@testing-library/react';
import { act } from 'react';
import { ROOM_MODE } from '@pomodoro/shared';
import type { Room } from '@pomodoro/shared';
import { useTabTitle } from './useTabTitle';

describe('useTabTitle', () => {
  const ORIGINAL_TITLE = 'web';
  const FOCUS_TIME_SEC = 1500;
  const startedAt = new Date('2026-01-01T00:00:00.000Z');

  const room: Room = {
    roomId: 'room-1',
    mode: ROOM_MODE.FOCUS,
    currentCycle: 1,
    timer: {
      status: 'RUNNING',
      focusTimeSec: FOCUS_TIME_SEC,
      breakTimeSec: 300,
      totalCycle: 4,
      timerStartedAt: startedAt.toISOString(),
      remainingTimeSec: FOCUS_TIME_SEC,
    },
    participants: [],
  };

  beforeEach(() => {
    document.title = ORIGINAL_TITLE;
    vi.useFakeTimers();
    vi.setSystemTime(startedAt);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('진행 중이면 1초마다 탭 제목의 남은 시간이 줄어든다', () => {
    // given
    renderHook(() => useTabTitle(room));
    expect(document.title).toBe('25:00 · 1st focus');

    // when
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    // then
    expect(document.title).toBe('24:59 · 1st focus');
  });

  it('room이 null이 되면 처음 제목으로 되돌린다', () => {
    // given
    const initialProps: { target: Room | null } = { target: room };
    const { rerender } = renderHook(
      ({ target }: { target: Room | null }) => useTabTitle(target),
      { initialProps },
    );

    // when
    rerender({ target: null });

    // then
    expect(document.title).toBe(ORIGINAL_TITLE);
  });

  it('언마운트하면 처음 제목으로 되돌린다', () => {
    // given
    const { unmount } = renderHook(() => useTabTitle(room));

    // when
    unmount();

    // then
    expect(document.title).toBe(ORIGINAL_TITLE);
  });
});
