import { renderHook } from '@testing-library/react';
import type { PointerEvent } from 'react';
import { useHorizontalSwipe } from './useHorizontalSwipe';

function pointer(clientX: number, clientY: number, pointerType = 'touch') {
  return { clientX, clientY, pointerType } as PointerEvent;
}

describe('useHorizontalSwipe', () => {
  const onPrev = vi.fn();
  const onNext = vi.fn();

  beforeEach(() => {
    onPrev.mockClear();
    onNext.mockClear();
    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      value: 393,
    });
  });

  it('왼쪽으로 48px 이상 밀면 다음으로 넘긴다', () => {
    // given
    const { result } = renderHook(() => useHorizontalSwipe({ onPrev, onNext }));

    // when
    result.current.onPointerDown(pointer(300, 400));
    result.current.onPointerUp(pointer(240, 410));

    // then
    expect(onNext).toHaveBeenCalledTimes(1);
    expect(onPrev).not.toHaveBeenCalled();
  });

  it('오른쪽으로 48px 이상 밀면 이전으로 넘긴다', () => {
    // given
    const { result } = renderHook(() => useHorizontalSwipe({ onPrev, onNext }));

    // when
    result.current.onPointerDown(pointer(100, 400));
    result.current.onPointerUp(pointer(160, 400));

    // then
    expect(onPrev).toHaveBeenCalledTimes(1);
    expect(onNext).not.toHaveBeenCalled();
  });

  it('48px보다 짧거나 세로로 더 많이 움직이면 넘기지 않는다', () => {
    // given
    const { result } = renderHook(() => useHorizontalSwipe({ onPrev, onNext }));

    // when
    result.current.onPointerDown(pointer(300, 400));
    result.current.onPointerUp(pointer(260, 400));
    result.current.onPointerDown(pointer(300, 400));
    result.current.onPointerUp(pointer(230, 500));

    // then
    expect(onNext).not.toHaveBeenCalled();
    expect(onPrev).not.toHaveBeenCalled();
  });

  it('화면 가장자리 20px에서 시작한 터치와 마우스는 무시한다', () => {
    // given
    const { result } = renderHook(() => useHorizontalSwipe({ onPrev, onNext }));

    // when
    result.current.onPointerDown(pointer(10, 400));
    result.current.onPointerUp(pointer(100, 400));
    result.current.onPointerDown(pointer(300, 400, 'mouse'));
    result.current.onPointerUp(pointer(200, 400, 'mouse'));

    // then
    expect(onNext).not.toHaveBeenCalled();
    expect(onPrev).not.toHaveBeenCalled();
  });
});
