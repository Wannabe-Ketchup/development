import { act, renderHook } from '@testing-library/react';
import { FLIP_DURATION_MS, JUMP_STAGGER_MS } from '../lib/intro-book';
import { useBookFlip } from './useBookFlip';

const setReducedMotion = (matches: boolean) => {
  vi.stubGlobal('matchMedia', () => ({
    matches,
    addEventListener: () => {},
    removeEventListener: () => {},
  }));
};

describe('useBookFlip', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('넘기는 중에 다시 넘겨도 한 장만 넘어간다', () => {
    // given
    setReducedMotion(false);
    const { result } = renderHook(() => useBookFlip());

    // when
    act(() => {
      result.current.flip('next');
      result.current.flip('next');
      result.current.flip('next');
    });

    // then
    expect(result.current.spread).toBe(2);
    expect(result.current.isFlipping).toBe(true);
  });

  it('책갈피로 건너뛰면 마지막 장이 끝날 때까지 다른 넘김을 받지 않는다', () => {
    // given
    setReducedMotion(false);
    const { result } = renderHook(() => useBookFlip());

    // when
    act(() => result.current.goTo(4));
    act(() => vi.advanceTimersByTime(JUMP_STAGGER_MS));
    act(() => result.current.flip('prev'));

    // then: 마지막 장(4)으로 넘어가는 중에는 입력이 버려진다
    expect(result.current.spread).toBe(3);
    act(() => vi.advanceTimersByTime(JUMP_STAGGER_MS));
    expect(result.current.spread).toBe(4);
    expect(result.current.isFlipping).toBe(true);
    act(() => vi.advanceTimersByTime(FLIP_DURATION_MS));
    expect(result.current.isFlipping).toBe(false);
    act(() => result.current.flip('prev'));
    expect(result.current.spread).toBe(3);
  });

  it('모션 줄이기 설정이면 기다리지 않고 바로 넘어간다', () => {
    // given
    setReducedMotion(true);
    const { result } = renderHook(() => useBookFlip());

    // when
    act(() => result.current.goTo(4));

    // then
    expect(result.current.spread).toBe(4);
    expect(result.current.isFlipping).toBe(false);
  });

  it('reset 하면 예약된 넘김이 실행되지 않고 첫 장으로 돌아간다', () => {
    // given
    setReducedMotion(false);
    const { result } = renderHook(() => useBookFlip());
    act(() => result.current.goTo(4));

    // when
    act(() => result.current.reset());
    act(() => vi.advanceTimersByTime(FLIP_DURATION_MS * 10));

    // then
    expect(result.current.spread).toBe(1);
    expect(result.current.isFlipping).toBe(false);
  });
});
