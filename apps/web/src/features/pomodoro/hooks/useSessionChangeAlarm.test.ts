import { renderHook } from '@testing-library/react';
import { ROOM_MODE, type RoomMode } from '@pomodoro/shared';
import { useSessionChangeAlarm } from './useSessionChangeAlarm';

interface SessionProps {
  mode: RoomMode | undefined;
  currentCycle: number | undefined;
}

const renderAlarm = (initialProps: SessionProps) =>
  renderHook(
    ({ mode, currentCycle }: SessionProps) =>
      useSessionChangeAlarm(mode, currentCycle),
    { initialProps },
  );

describe('useSessionChangeAlarm', () => {
  let playSpy: ReturnType<typeof vi.spyOn>;

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const mockPlay = (implementation: () => Promise<void>) => {
    vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
    playSpy = vi
      .spyOn(HTMLMediaElement.prototype, 'play')
      .mockImplementation(implementation);
  };

  it('세션이 바뀌면 알림음을 재생한다', () => {
    // given
    mockPlay(() => Promise.resolve());
    const { rerender } = renderAlarm({
      mode: ROOM_MODE.FOCUS,
      currentCycle: 1,
    });

    // when
    rerender({ mode: ROOM_MODE.BREAK, currentCycle: 1 });

    // then
    const expectedPlayCount = 1;
    expect(playSpy).toHaveBeenCalledTimes(expectedPlayCount);
  });

  it('브라우저가 재생을 거부해도 에러 없이 넘어간다', async () => {
    // given
    mockPlay(() => Promise.reject(new Error('NotAllowedError')));
    const { rerender } = renderAlarm({
      mode: ROOM_MODE.FOCUS,
      currentCycle: 1,
    });

    // when
    const changeSession = () =>
      rerender({ mode: ROOM_MODE.BREAK, currentCycle: 1 });

    // then
    expect(changeSession).not.toThrow();
    await Promise.resolve();
    expect(playSpy).toHaveBeenCalledTimes(1);
  });
});
