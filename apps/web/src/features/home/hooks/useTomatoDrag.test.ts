import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { HomeLayout } from '../lib/home-layout';
import { useTomatoDrag } from './useTomatoDrag';

const TABLE_RECT = { left: 100, right: 300, top: 100, bottom: 300 };
const DRAG_DISTANCE_PX = 10;

function renderDragHook(layout: HomeLayout) {
  const hook = renderHook(({ layout }) => useTomatoDrag(layout), {
    initialProps: { layout },
  });
  hook.result.current.tableRef.current = {
    getBoundingClientRect: () => TABLE_RECT,
  } as HTMLDivElement;
  return hook;
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

type DragResult = ReturnType<typeof renderDragHook>['result'];

function startDrag(result: DragResult, x: number, y: number) {
  act(() => result.current.handlers.onPointerDown(pointerEvent(0, 0)));
  act(() =>
    result.current.handlers.onPointerMove(
      pointerEvent(DRAG_DISTANCE_PX, DRAG_DISTANCE_PX),
    ),
  );
  act(() => result.current.handlers.onPointerMove(pointerEvent(x, y)));
}

function dragAndDrop(result: DragResult, dropX: number, dropY: number) {
  startDrag(result, dropX, dropY);
  act(() => result.current.handlers.onPointerUp(pointerEvent(dropX, dropY, 0)));
}

describe('useTomatoDrag', () => {
  it.each([
    { layout: 'desktop', dropInsetPx: 48 },
    { layout: 'medium', dropInsetPx: 36 },
    { layout: 'portrait', dropInsetPx: 24 },
    { layout: 'landscape', dropInsetPx: 16 },
  ] as const)(
    '$layout에서 점선 밖 12px 안에 놓으면 방 선택이 열린다',
    ({ layout, dropInsetPx }) => {
      // given
      const { result } = renderDragHook(layout);
      const dropX = TABLE_RECT.right + dropInsetPx + 12;
      const dropY = TABLE_RECT.top + 50;

      // when
      dragAndDrop(result, dropX, dropY);

      // then
      const expectedStatus = 'studying';
      expect(result.current.tomatoState.status).toBe(expectedStatus);
    },
  );

  it('점선 밖 12px보다 멀리 놓으면 토마토가 소파로 돌아간다', () => {
    // given
    const { result } = renderDragHook('portrait');
    const dropX = TABLE_RECT.right + 24 + 13;
    const dropY = TABLE_RECT.top + 50;

    // when
    dragAndDrop(result, dropX, dropY);

    // then
    const expectedStatus = 'sleeping';
    expect(result.current.tomatoState.status).toBe(expectedStatus);
  });

  it('끄는 중 레이아웃이 바뀌면 끌기가 취소되고 이어지는 움직임은 무시한다', () => {
    // given
    const { result, rerender } = renderDragHook('portrait');
    startDrag(result, 200, 200);

    // when
    rerender({ layout: 'landscape' });
    act(() => result.current.handlers.onPointerMove(pointerEvent(210, 210)));

    // then
    const expectedStatus = 'sleeping';
    expect(result.current.tomatoState.status).toBe(expectedStatus);
  });
});
