import { renderHook } from '@testing-library/react';
import { ROOM_MODE, type RoomMode } from '@pomodoro/shared';
import {
  isUserAwayFromPage,
  showNotificationIfPermitted,
} from '../lib/browser-notification';
import { useSessionChangeNotification } from './useSessionChangeNotification';

vi.mock('../lib/browser-notification');

interface SessionProps {
  mode: RoomMode;
  currentCycle: number;
  timerStartedAt: string | null;
}

const FOCUS_STARTED_AT = '2026-11-01T10:00:00.000Z';
const BREAK_STARTED_AT = '2026-11-01T10:25:00.000Z';

const renderNotification = (initialProps: SessionProps) =>
  renderHook(
    ({ mode, currentCycle, timerStartedAt }: SessionProps) =>
      useSessionChangeNotification(
        'room-1',
        mode,
        currentCycle,
        timerStartedAt,
      ),
    { initialProps },
  );

describe('useSessionChangeNotification', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  const changeSession = () => {
    const { rerender } = renderNotification({
      mode: ROOM_MODE.FOCUS,
      currentCycle: 1,
      timerStartedAt: FOCUS_STARTED_AT,
    });
    rerender({
      mode: ROOM_MODE.BREAK,
      currentCycle: 1,
      timerStartedAt: BREAK_STARTED_AT,
    });
  };

  it('화면을 보고 있지 않을 때 세션이 바뀌면 알림을 띄운다', () => {
    // given
    vi.mocked(isUserAwayFromPage).mockReturnValue(true);

    // when
    changeSession();

    // then
    expect(showNotificationIfPermitted).toHaveBeenCalledWith(
      '1회차 휴식 시작',
      expect.objectContaining({
        tag: `pomodoro:room-1:BREAK:1:${BREAK_STARTED_AT}`,
      }),
    );
  });

  it('화면을 보고 있을 때 세션이 바뀌면 알림을 띄우지 않는다', () => {
    // given
    vi.mocked(isUserAwayFromPage).mockReturnValue(false);

    // when
    changeSession();

    // then
    expect(showNotificationIfPermitted).not.toHaveBeenCalled();
  });

  it('4회차를 마치고 대기로 돌아오면 직전 세션의 시작 시각으로 tag를 만든다', () => {
    // given
    vi.mocked(isUserAwayFromPage).mockReturnValue(true);
    const { rerender } = renderNotification({
      mode: ROOM_MODE.BREAK,
      currentCycle: 4,
      timerStartedAt: BREAK_STARTED_AT,
    });

    // when
    rerender({ mode: ROOM_MODE.IDLE, currentCycle: 0, timerStartedAt: null });

    // then
    expect(showNotificationIfPermitted).toHaveBeenCalledWith(
      '4회차를 모두 마쳤어요',
      expect.objectContaining({
        tag: `pomodoro:room-1:IDLE:0:${BREAK_STARTED_AT}`,
      }),
    );
  });
});
