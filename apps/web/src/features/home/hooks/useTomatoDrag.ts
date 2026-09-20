import { useReducer, useRef } from 'react';
import { tomatoReducer, initialTomatoState } from './tomatoReducer';

const DRAG_THRESHOLD = 5;
const DROP_MARGIN = 60;

export function useTomatoDrag() {
  const [state, dispatch] = useReducer(tomatoReducer, initialTomatoState);

  const tableRef = useRef<HTMLDivElement>(null);
  const pointerStartPos = useRef<{ x: number; y: number } | null>(null);

  const handlePointerDown = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    pointerStartPos.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!pointerStartPos.current) return;

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
    if (state.status !== 'dragging') {
      pointerStartPos.current = null;
      return;
    }
    const rect = tableRef.current?.getBoundingClientRect();
    const isOverTable =
      !!rect &&
      e.clientX >= rect.left - DROP_MARGIN &&
      e.clientX <= rect.right + DROP_MARGIN &&
      e.clientY >= rect.top - DROP_MARGIN &&
      e.clientY <= rect.bottom + DROP_MARGIN;

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

  return {
    tomatoState: state,
    tableRef,
    handlers: {
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: handlePointerUp,
      onPointerCancel: handlePointerCancel,
      onLostPointerCapture: handleLostPointerCapture,
    },
  };
}
