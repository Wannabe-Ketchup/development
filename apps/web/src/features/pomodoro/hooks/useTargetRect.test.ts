import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTargetRect } from './useTargetRect';

const SELECTOR = '[data-tour-id="target"]';

function createTarget(rect: DOMRect) {
  const el = document.createElement('div');
  el.setAttribute('data-tour-id', 'target');
  const spy = vi.spyOn(el, 'getBoundingClientRect').mockReturnValue(rect);
  document.body.appendChild(el);
  return { el, spy };
}

function advanceFrame() {
  act(() => {
    vi.advanceTimersToNextFrame();
  });
}

describe('useTargetRect', () => {
  beforeEach(() => {
    vi.useFakeTimers({
      toFake: ['requestAnimationFrame', 'cancelAnimationFrame'],
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = '';
  });

  it('타겟이 있으면 마운트 직후 타겟의 rect를 반환한다', () => {
    // given
    createTarget(new DOMRect(10, 20, 100, 50));

    // when
    const { result } = renderHook(() => useTargetRect(SELECTOR));

    // then
    expect(result.current).toMatchObject({
      x: 10,
      y: 20,
      width: 100,
      height: 50,
    });
  });

  it('이벤트 없이 타겟 위치가 바뀌어도 다음 프레임에 새 rect를 반환한다', () => {
    // given
    const { spy } = createTarget(new DOMRect(10, 20, 100, 50));
    const { result } = renderHook(() => useTargetRect(SELECTOR));

    // when
    spy.mockReturnValue(new DOMRect(300, 20, 100, 50));
    advanceFrame();

    // then
    expect(result.current).toMatchObject({ x: 300, y: 20 });
  });

  it('rect 값이 그대로면 새 DOMRect가 측정돼도 같은 참조를 유지한다', () => {
    // given
    const { spy } = createTarget(new DOMRect(10, 20, 100, 50));
    const { result } = renderHook(() => useTargetRect(SELECTOR));
    const firstRect = result.current;

    // when: 값은 같고 객체만 새로 만들어진다
    spy.mockReturnValue(new DOMRect(10, 20, 100, 50));
    advanceFrame();

    // then
    expect(result.current).toBe(firstRect);
  });

  it('측정 후 타겟이 DOM에서 사라지면 null을 반환한다', () => {
    // given
    const { el } = createTarget(new DOMRect(10, 20, 100, 50));
    const { result } = renderHook(() => useTargetRect(SELECTOR));
    expect(result.current).not.toBeNull();

    // when
    el.remove();
    advanceFrame();

    // then
    expect(result.current).toBeNull();
  });

  it('selector가 null이면 null을 반환하고 측정하지 않는다', () => {
    // given
    const { spy } = createTarget(new DOMRect(10, 20, 100, 50));

    // when
    const { result } = renderHook(() => useTargetRect(null));
    advanceFrame();

    // then
    expect(result.current).toBeNull();
    expect(spy).not.toHaveBeenCalled();
  });

  it('언마운트하면 더 이상 측정하지 않는다', () => {
    // given
    const { spy } = createTarget(new DOMRect(10, 20, 100, 50));
    const { unmount } = renderHook(() => useTargetRect(SELECTOR));
    spy.mockClear();

    // when
    unmount();
    advanceFrame();

    // then
    expect(spy).not.toHaveBeenCalled();
  });
});
