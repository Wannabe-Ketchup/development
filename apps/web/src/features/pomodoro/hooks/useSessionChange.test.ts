import { renderHook } from '@testing-library/react';
import { ROOM_MODE, type RoomMode } from '@pomodoro/shared';
import { useSessionChange } from './useSessionChange';

interface SessionProps {
  mode: RoomMode | undefined;
  currentCycle: number | undefined;
}

describe('useSessionChange', () => {
  const renderSessionChange = (
    initialProps: SessionProps,
    onChange: () => void,
  ) =>
    renderHook(
      ({ mode, currentCycle }: SessionProps) =>
        useSessionChange(mode, currentCycle, onChange),
      { initialProps },
    );

  it('처음 받은 세션에는 onChange를 부르지 않는다', () => {
    // given
    const onChange = vi.fn();

    // when
    renderSessionChange({ mode: ROOM_MODE.FOCUS, currentCycle: 1 }, onChange);

    // then
    expect(onChange).not.toHaveBeenCalled();
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
  ])('$name로 바뀌면 onChange를 한 번 부른다', ({ from, to }) => {
    // given
    const onChange = vi.fn();
    const { rerender } = renderSessionChange(from, onChange);

    // when
    rerender(to);

    // then
    const expectedCallCount = 1;
    expect(onChange).toHaveBeenCalledTimes(expectedCallCount);
    expect(onChange).toHaveBeenCalledWith(to);
  });

  it('mode와 회차가 그대로면 다시 렌더링되어도 onChange를 부르지 않는다', () => {
    // given
    const onChange = vi.fn();
    const { rerender } = renderSessionChange(
      { mode: ROOM_MODE.FOCUS, currentCycle: 1 },
      onChange,
    );

    // when
    rerender({ mode: ROOM_MODE.FOCUS, currentCycle: 1 });

    // then
    expect(onChange).not.toHaveBeenCalled();
  });
});
