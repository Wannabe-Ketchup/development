import { describe, expect, it } from 'vitest';
import { renderHook } from '@testing-library/react';
import { getSeatMoveDurationMs } from '../lib/seat-layout';
import { useSeatMoveDuration } from './useSeatMoveDuration';

describe('useSeatMoveDuration', () => {
  it('위치가 바뀌면 직전 위치에서 움직인 거리로 시간을 정한다', () => {
    // given
    const { result, rerender } = renderHook(({ x }) => useSeatMoveDuration(x), {
      initialProps: { x: 0 },
    });

    // when
    rerender({ x: -786 });

    // then
    expect(result.current).toBe(getSeatMoveDurationMs(786));
  });
});
