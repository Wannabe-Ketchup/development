import { describe, expect, it } from 'vitest';
import { renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { TimerElementContext, useCoversTimer } from './useCoversTimer';

function createElementAt(rect: {
  top: number;
  bottom: number;
  left: number;
  right: number;
}) {
  const element = document.createElement('div');
  element.getBoundingClientRect = () => ({ ...rect }) as DOMRect;
  return element;
}

const TIMER_RECT = { top: 52, bottom: 144, left: 20, right: 373 };

function renderWithTimer(target: HTMLElement | null) {
  const timer = createElementAt(TIMER_RECT);
  const wrapper = ({ children }: { children: ReactNode }) => (
    <TimerElementContext value={timer}>{children}</TimerElementContext>
  );
  return renderHook(() => useCoversTimer(target), { wrapper });
}

describe('useCoversTimer', () => {
  it('타이머 아래 끝보다 위로 올라오면 겹친다', () => {
    // given
    const target = createElementAt({
      top: 130,
      bottom: 242,
      left: 130,
      right: 263,
    });

    // when
    const { result } = renderWithTimer(target);

    // then
    expect(result.current).toBe(true);
  });

  it('타이머보다 아래에 있으면 겹치지 않는다', () => {
    // given
    const target = createElementAt({
      top: 150,
      bottom: 262,
      left: 130,
      right: 263,
    });

    // when
    const { result } = renderWithTimer(target);

    // then
    expect(result.current).toBe(false);
  });

  it('높이가 겹쳐도 옆으로 비켜 있으면 겹치지 않는다', () => {
    // given
    const target = createElementAt({
      top: 130,
      bottom: 242,
      left: 400,
      right: 533,
    });

    // when
    const { result } = renderWithTimer(target);

    // then
    expect(result.current).toBe(false);
  });
});
