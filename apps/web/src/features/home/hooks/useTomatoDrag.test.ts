import { createElement, type ReactNode } from 'react';
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { StageScaleContext } from '@/hooks/useStageScale';
import { useTomatoDrag } from './useTomatoDrag';

const TABLE_RECT = { left: 100, right: 300, top: 100, bottom: 300 };
const DRAG_DISTANCE_PX = 10;

function renderDragHook(scale: number) {
  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(StageScaleContext, { value: scale }, children);
  const { result } = renderHook(() => useTomatoDrag(), { wrapper });
  result.current.tableRef.current = {
    getBoundingClientRect: () => TABLE_RECT,
  } as HTMLDivElement;
  return result;
}

function pointerEvent(clientX: number, clientY: number, buttons = 1) {
  return {
    pointerId: 1,
    clientX,
    clientY,
    buttons,
    currentTarget: { setPointerCapture: vi.fn() },
  } as unknown as React.PointerEvent;
}

function dragAndDrop(
  result: ReturnType<typeof renderDragHook>,
  dropX: number,
  dropY: number,
) {
  act(() => result.current.handlers.onPointerDown(pointerEvent(0, 0)));
  act(() =>
    result.current.handlers.onPointerMove(
      pointerEvent(DRAG_DISTANCE_PX, DRAG_DISTANCE_PX),
    ),
  );
  act(() => result.current.handlers.onPointerMove(pointerEvent(dropX, dropY)));
  act(() => result.current.handlers.onPointerUp(pointerEvent(dropX, dropY, 0)));
}

describe('useTomatoDrag', () => {
  it('축소되지 않은 화면에서 책상 밖 60px 안에 토마토를 놓으면 공부 중 상태가 된다', () => {
    // given
    const result = renderDragHook(1);
    const dropX = TABLE_RECT.right + 59;
    const dropY = TABLE_RECT.top + 50;

    // when
    dragAndDrop(result, dropX, dropY);

    // then
    const expectedStatus = 'studying';
    expect(result.current.tomatoState.status).toBe(expectedStatus);
  });

  it('화면이 절반으로 축소되면 책상 밖 40px에 놓은 토마토는 소파로 돌아간다', () => {
    // given
    const result = renderDragHook(0.5);
    const dropX = TABLE_RECT.right + 40;
    const dropY = TABLE_RECT.top + 50;

    // when
    dragAndDrop(result, dropX, dropY);

    // then
    const expectedStatus = 'sleeping';
    expect(result.current.tomatoState.status).toBe(expectedStatus);
  });
});
