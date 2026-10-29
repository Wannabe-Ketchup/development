import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCoachMarkTour } from './useCoachMarkTour';

describe('useCoachMarkTour', () => {
  it('`openTour` 호출 시 stepIndex가 0으로 초기화된다', () => {
    // given
    const { result } = renderHook(() => useCoachMarkTour({ totalSteps: 6 }));

    // when: 투어를 열고 스텝 이동 후 다시 열기
    act(() => result.current.openTour());
    act(() => result.current.goNext());
    act(() => result.current.closeTour());
    act(() => result.current.openTour());

    // then
    expect(result.current.isOpen).toBe(true);
    expect(result.current.stepIndex).toBe(0);
  });

  it('마지막 스텝에서 `goNext`를 호출해도 stepIndex가 유지된다', () => {
    // given
    const { result } = renderHook(() => useCoachMarkTour({ totalSteps: 6 }));
    act(() => result.current.openTour());

    // when: 마지막 스텝(5)까지 이동
    for (let i = 0; i < 10; i++) {
      act(() => result.current.goNext());
    }

    // then
    expect(result.current.stepIndex).toBe(5);
  });

  it('첫 스텝에서 `goPrev`를 호출해도 stepIndex가 유지된다', () => {
    // given
    const { result } = renderHook(() => useCoachMarkTour({ totalSteps: 6 }));
    act(() => result.current.openTour());

    // when
    act(() => result.current.goPrev());
    act(() => result.current.goPrev());

    // then
    expect(result.current.stepIndex).toBe(0);
  });

  it('controlled 모드에서 `open` prop이 변경되면 `isOpen`이 따라간다', () => {
    // given
    const { result, rerender } = renderHook(
      ({ open }: { open: boolean }) =>
        useCoachMarkTour({ totalSteps: 6, open }),
      { initialProps: { open: false } },
    );

    // when
    rerender({ open: true });

    // then
    expect(result.current.isOpen).toBe(true);

    // when
    rerender({ open: false });

    // then
    expect(result.current.isOpen).toBe(false);
  });

  it('`closeTour` 호출 시 `onOpenChange(false)`가 호출된다', () => {
    // given
    const onOpenChange = vi.fn();
    const { result } = renderHook(() =>
      useCoachMarkTour({ totalSteps: 6, onOpenChange }),
    );
    act(() => result.current.openTour());

    // when
    act(() => result.current.closeTour());

    // then
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
