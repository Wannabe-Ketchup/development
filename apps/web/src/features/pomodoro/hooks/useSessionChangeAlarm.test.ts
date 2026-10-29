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

  it('처음 받은 세션에는 알림음을 재생하지 않는다', () => {
    // given
    mockPlay(() => Promise.resolve());

    // when
    renderAlarm({ mode: ROOM_MODE.FOCUS, currentCycle: 1 });

    // then
    expect(playSpy).not.toHaveBeenCalled();
  });

  it.each([
    {
      name: '대기→집중',
      from: { mode: ROOM_MODE.IDLE, currentCycle: 0 },
      to: { mode: ROOM_MODE.FOCUS, currentCycle: 1 },
    },
    {
      name: '집중→휴식',
      from: { mode: ROOM_MODE.FOCUS, currentCycle: 1 },
      to: { mode: ROOM_MODE.BREAK, currentCycle: 1 },
    },
    {
      name: '휴식→다음 회차 집중',
      from: { mode: ROOM_MODE.BREAK, currentCycle: 1 },
      to: { mode: ROOM_MODE.FOCUS, currentCycle: 2 },
    },
    {
      name: '휴식→대기',
      from: { mode: ROOM_MODE.BREAK, currentCycle: 4 },
      to: { mode: ROOM_MODE.IDLE, currentCycle: 0 },
    },
  ])('$name로 바뀌면 알림음을 재생한다', ({ from, to }) => {
    // given
    mockPlay(() => Promise.resolve());
    const { rerender } = renderAlarm(from);

    // when
    rerender(to);

    // then
    const expectedPlayCount = 1;
    expect(playSpy).toHaveBeenCalledTimes(expectedPlayCount);
  });

  it('mode와 회차가 그대로면 다시 렌더링되어도 알림음을 재생하지 않는다', () => {
    // given
    mockPlay(() => Promise.resolve());
    const { rerender } = renderAlarm({
      mode: ROOM_MODE.FOCUS,
      currentCycle: 1,
    });

    // when
    rerender({ mode: ROOM_MODE.FOCUS, currentCycle: 1 });

    // then
    expect(playSpy).not.toHaveBeenCalled();
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
