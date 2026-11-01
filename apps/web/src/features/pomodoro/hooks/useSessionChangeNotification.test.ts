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
}

describe('useSessionChangeNotification', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  const changeSession = () => {
    const initialProps: SessionProps = {
      mode: ROOM_MODE.FOCUS,
      currentCycle: 1,
    };
    const { rerender } = renderHook(
      ({ mode, currentCycle }: SessionProps) =>
        useSessionChangeNotification('room-1', mode, currentCycle),
      { initialProps },
    );
    rerender({ mode: ROOM_MODE.BREAK, currentCycle: 1 });
  };

  it('화면을 보고 있지 않을 때 세션이 바뀌면 알림을 띄운다', () => {
    // given
    vi.mocked(isUserAwayFromPage).mockReturnValue(true);

    // when
    changeSession();

    // then
    expect(showNotificationIfPermitted).toHaveBeenCalledWith(
      '1회차 휴식 시작',
      expect.objectContaining({ tag: 'pomodoro:room-1:BREAK:1' }),
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
});
