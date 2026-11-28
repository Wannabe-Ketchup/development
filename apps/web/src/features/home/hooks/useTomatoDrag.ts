import { useReducer, useRef, useState } from 'react';
import {
  DROP_SLACK_PX,
  HOME_LAYOUT_METRICS,
  type HomeLayout,
} from '../lib/home-layout';
import { tomatoReducer, initialTomatoState } from './tomatoReducer';

const DRAG_THRESHOLD = 5;

export function useTomatoDrag(layout: HomeLayout) {
  const [state, dispatch] = useReducer(tomatoReducer, initialTomatoState);

  // 끄는 중 레이아웃이 바뀌면(회전 등) 끌기를 취소하고 토마토를 소파로 돌린다
  const [prevLayout, setPrevLayout] = useState(layout);
  if (prevLayout !== layout) {
    setPrevLayout(layout);
    if (state.status === 'dragging') dispatch({ type: 'CANCEL' });
  }

  const tableRef = useRef<HTMLDivElement>(null);
  const pointerStartPos = useRef<{
    x: number;
    y: number;
    layout: HomeLayout;
  } | null>(null);

  // 레이아웃이 바뀐 뒤에 이어지는 포인터 이벤트는 취소한 끌기의 것이므로 무시한다
  const isStaleGesture = () => pointerStartPos.current?.layout !== layout;

  const handlePointerDown = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    pointerStartPos.current = { x: e.clientX, y: e.clientY, layout };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!pointerStartPos.current) return;
    if (isStaleGesture()) {
      pointerStartPos.current = null;
      return;
    }

    if (e.buttons === 0) {
      dispatch({ type: 'CANCEL' });
      pointerStartPos.current = null;
      return;
    }

    const dx = e.clientX - pointerStartPos.current.x;
    const dy = e.clientY - pointerStartPos.current.y;
    if (state.status === 'sleeping' && Math.hypot(dx, dy) < DRAG_THRESHOLD)
      return;

    dispatch({
      type: state.status === 'sleeping' ? 'DRAG_START' : 'DRAG_MOVE',
      pos: { x: e.clientX, y: e.clientY },
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (state.status !== 'dragging' || isStaleGesture()) {
      pointerStartPos.current = null;
      return;
    }
    const rect = tableRef.current?.getBoundingClientRect();
    const dropMargin = HOME_LAYOUT_METRICS[layout].dropInsetPx + DROP_SLACK_PX;
    const isOverTable =
      !!rect &&
      rect.left - dropMargin <= e.clientX &&
      e.clientX <= rect.right + dropMargin &&
      rect.top - dropMargin <= e.clientY &&
      e.clientY <= rect.bottom + dropMargin;

    dispatch({ type: 'DROP', isOverTable });
    pointerStartPos.current = null;
  };

  const handlePointerCancel = () => {
    dispatch({ type: 'CANCEL' });
    pointerStartPos.current = null;
  };

  const handleLostPointerCapture = () => {
    if (pointerStartPos.current !== null) {
      dispatch({ type: 'CANCEL' });
      pointerStartPos.current = null;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      dispatch({ type: 'ACTIVATE' });
    }
  };

  const cancel = () => dispatch({ type: 'CANCEL' });

  return {
    tomatoState: state,
    tableRef,
    cancel,
    handlers: {
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: handlePointerUp,
      onPointerCancel: handlePointerCancel,
      onLostPointerCapture: handleLostPointerCapture,
      onKeyDown: handleKeyDown,
    },
  };
}
