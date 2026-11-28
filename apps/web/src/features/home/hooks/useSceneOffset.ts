import { useLayoutEffect, type RefObject } from 'react';
import { useVisualViewportRect } from '@/hooks/useVisualViewportRect';
import { getSceneOffsetPx, type HomeLayout } from '../lib/home-layout';

interface UseSceneOffsetParams {
  layout: HomeLayout;
  isPopoverOpen: boolean;
  // 안전 영역 안쪽 장면 컨테이너. 여기에 세로 이동을 건다
  sceneRef: RefObject<HTMLElement | null>;
  // 소파·안내·테이블 한 줄
  rowRef: RefObject<HTMLElement | null>;
  // 말풍선 루트. 안에 오류 문구(role="alert")가 있다
  popoverRef: RefObject<HTMLElement | null>;
}

// 말풍선이 열려 있는 동안 장면을 세로로 옮겨, 말풍선이 보이는 영역(화면 키보드 제외) 안에 오게 한다.
// 이동 값은 측정 직후 DOM에 바로 적용한다. 측정은 이동을 걸기 전 위치로 해야 하는데,
// 상태로 돌려주면 아직 그려지지 않은 값과 실제 위치가 어긋나기 때문이다. 닫히면 이동을 푼다.
export function useSceneOffset({
  layout,
  isPopoverOpen,
  sceneRef,
  rowRef,
  popoverRef,
}: UseSceneOffsetParams): void {
  const viewport = useVisualViewportRect();

  useLayoutEffect(() => {
    const scene = sceneRef.current;
    const row = rowRef.current;
    const popover = popoverRef.current;
    if (!isPopoverOpen || !scene || !row || !popover) return;

    const applyOffset = () => {
      scene.style.transform = '';
      const sceneRect = scene.getBoundingClientRect();
      const rowRect = row.getBoundingClientRect();
      const popoverRect = popover.getBoundingClientRect();
      const alert = popover.querySelector('[role="alert"]');
      const alertRect = alert?.textContent
        ? alert.getBoundingClientRect()
        : undefined;

      const popoverRange = {
        top: Math.min(popoverRect.top, alertRect?.top ?? popoverRect.top),
        bottom: popoverRect.bottom,
      };
      const group = {
        top: Math.min(popoverRange.top, rowRect.top),
        bottom: Math.max(popoverRange.bottom, rowRect.bottom),
      };
      const visible = {
        top: Math.max(viewport.top, sceneRect.top),
        bottom: Math.min(viewport.top + viewport.height, sceneRect.bottom),
      };

      const offsetPx = getSceneOffsetPx({
        popover: popoverRange,
        group,
        visible,
        shouldCenterGroup: layout === 'landscape',
      });
      scene.style.transform = `translateY(${offsetPx}px)`;
    };

    // 첫 화면부터 맞추고, 단계·오류 문구의 크기가 바뀌면 다시 측정한다.
    applyOffset();
    const observer = new ResizeObserver(applyOffset);
    observer.observe(popover);
    observer.observe(row);
    observer.observe(scene);
    const alert = popover.querySelector('[role="alert"]');
    if (alert) observer.observe(alert);
    return () => {
      observer.disconnect();
      scene.style.transform = '';
    };
  }, [
    layout,
    isPopoverOpen,
    viewport.top,
    viewport.height,
    sceneRef,
    rowRef,
    popoverRef,
  ]);
}
