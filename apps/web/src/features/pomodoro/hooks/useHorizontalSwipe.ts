import { useRef, type PointerEvent, type PointerEventHandler } from 'react';

// 가로로 이 이상 움직여야 넘긴다
const MIN_SWIPE_DISTANCE_PX = 48;
// 화면 가장자리에서 시작한 터치는 뒤로 가기 제스처와 겹쳐 무시한다
const EDGE_IGNORE_PX = 20;

interface UseHorizontalSwipeParams {
  onPrev: () => void;
  onNext: () => void;
}

// 왼쪽으로 밀면 다음, 오른쪽으로 밀면 이전. 세로 스크롤은 막지 않도록 요소에 touch-action: pan-y를 준다.
// 마우스는 글자 선택·클릭과 겹쳐서 쓰지 않는다. 화살표 버튼이 대안이다
export function useHorizontalSwipe({
  onPrev,
  onNext,
}: UseHorizontalSwipeParams): {
  onPointerDown: PointerEventHandler;
  onPointerUp: PointerEventHandler;
  onPointerCancel: PointerEventHandler;
} {
  const startRef = useRef<{ x: number; y: number } | null>(null);

  const onPointerDown = (event: PointerEvent) => {
    startRef.current = null;
    if (event.pointerType === 'mouse') return;
    const isEdge =
      event.clientX < EDGE_IGNORE_PX ||
      window.innerWidth - event.clientX < EDGE_IGNORE_PX;
    if (isEdge) return;
    startRef.current = { x: event.clientX, y: event.clientY };
  };

  const onPointerUp = (event: PointerEvent) => {
    const start = startRef.current;
    startRef.current = null;
    if (!start) return;

    const deltaX = event.clientX - start.x;
    const deltaY = event.clientY - start.y;
    const isHorizontal =
      MIN_SWIPE_DISTANCE_PX <= Math.abs(deltaX) &&
      Math.abs(deltaY) < Math.abs(deltaX);
    if (!isHorizontal) return;

    if (deltaX < 0) onNext();
    else onPrev();
  };

  const onPointerCancel = () => {
    startRef.current = null;
  };

  return { onPointerDown, onPointerUp, onPointerCancel };
}
