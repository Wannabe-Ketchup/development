export type Placement = 'top' | 'bottom' | 'left' | 'right';

// 타겟과 말풍선 사이 간격: 스포트라이트 여백(12px) + 꼬리 길이(12px, bubble-path의 BUBBLE_TAIL_HEIGHT_PX) + 여유(4px).
export const BUBBLE_GAP_PX = 28;
export const BUBBLE_VIEWPORT_MARGIN_PX = 16;
// 꼬리가 말풍선 모서리 둥글기(16px)와 겹치지 않도록 가장자리에서 띄우는 거리.
export const BUBBLE_TAIL_EDGE_MARGIN_PX = 28;

export interface BubbleTail {
  placement: Placement;
  offset: number;
}

export interface PlacementInput {
  targetRect: { x: number; y: number; width: number; height: number };
  bubbleSize: { width: number; height: number };
  viewport: { width: number; height: number };
  preferredPlacement?: Placement;
}

export interface PlacementResult {
  placement: Placement;
  left: number;
  top: number;
  // 어느 방향이든 실제로 들어가서 배치됐는가. false면 말풍선이 타겟과 겹칠 수 있다.
  fits: boolean;
  // 꼬리가 놓일 위치. bottom/top이면 말풍선 왼쪽 끝, left/right이면 위쪽 끝에서 타겟 중심까지의 거리(px).
  arrowOffset: number;
}

function canFit(
  placement: Placement,
  targetRect: PlacementInput['targetRect'],
  bubbleSize: PlacementInput['bubbleSize'],
  viewport: PlacementInput['viewport'],
): boolean {
  const m = BUBBLE_VIEWPORT_MARGIN_PX;
  const g = BUBBLE_GAP_PX;

  switch (placement) {
    case 'bottom':
      return (
        targetRect.y + targetRect.height + g + bubbleSize.height <=
        viewport.height - m
      );
    case 'top':
      return targetRect.y - g - bubbleSize.height >= m;
    case 'right':
      return (
        targetRect.x + targetRect.width + g + bubbleSize.width <=
        viewport.width - m
      );
    case 'left':
      return targetRect.x - g - bubbleSize.width >= m;
  }
}

function getAvailableSpace(
  placement: Placement,
  targetRect: PlacementInput['targetRect'],
  viewport: PlacementInput['viewport'],
): number {
  switch (placement) {
    case 'bottom':
      return viewport.height - (targetRect.y + targetRect.height);
    case 'top':
      return targetRect.y;
    case 'right':
      return viewport.width - (targetRect.x + targetRect.width);
    case 'left':
      return targetRect.x;
  }
}

function computePosition(
  placement: Placement,
  targetRect: PlacementInput['targetRect'],
  bubbleSize: PlacementInput['bubbleSize'],
  viewport: PlacementInput['viewport'],
): { left: number; top: number } {
  const m = BUBBLE_VIEWPORT_MARGIN_PX;
  const g = BUBBLE_GAP_PX;

  let left: number;
  let top: number;

  switch (placement) {
    case 'bottom':
      left = targetRect.x + targetRect.width / 2 - bubbleSize.width / 2;
      top = targetRect.y + targetRect.height + g;
      break;
    case 'top':
      left = targetRect.x + targetRect.width / 2 - bubbleSize.width / 2;
      top = targetRect.y - g - bubbleSize.height;
      break;
    case 'right':
      left = targetRect.x + targetRect.width + g;
      top = targetRect.y + targetRect.height / 2 - bubbleSize.height / 2;
      break;
    case 'left':
      left = targetRect.x - g - bubbleSize.width;
      top = targetRect.y + targetRect.height / 2 - bubbleSize.height / 2;
      break;
  }

  // viewport margin clamp
  left = Math.max(m, Math.min(left, viewport.width - bubbleSize.width - m));
  top = Math.max(m, Math.min(top, viewport.height - bubbleSize.height - m));

  return { left, top };
}

export function computeBubblePlacement(input: PlacementInput): PlacementResult {
  const { targetRect, bubbleSize, viewport, preferredPlacement } = input;

  const fallbackOrder: Placement[] = ['bottom', 'top', 'right', 'left'];

  // preferred → fallback 순서로 fit 검사
  const orderedPlacements: Placement[] = preferredPlacement
    ? [
        preferredPlacement,
        ...fallbackOrder.filter((p) => p !== preferredPlacement),
      ]
    : fallbackOrder;

  const fittingPlacement = orderedPlacements.find((p) =>
    canFit(p, targetRect, bubbleSize, viewport),
  );

  const placement =
    fittingPlacement ??
    // 어디에도 fit 안 되면 공간이 가장 넓은 방향 사용
    (orderedPlacements.reduce((best, p) =>
      getAvailableSpace(p, targetRect, viewport) >
      getAvailableSpace(best, targetRect, viewport)
        ? p
        : best,
    ) as Placement);

  const { left, top } = computePosition(
    placement,
    targetRect,
    bubbleSize,
    viewport,
  );

  return {
    placement,
    left,
    top,
    fits: fittingPlacement !== undefined,
    arrowOffset: computeArrowOffset(placement, targetRect, bubbleSize, {
      left,
      top,
    }),
  };
}

function computeArrowOffset(
  placement: Placement,
  targetRect: PlacementInput['targetRect'],
  bubbleSize: PlacementInput['bubbleSize'],
  position: { left: number; top: number },
): number {
  const isHorizontalEdge = placement === 'top' || placement === 'bottom';
  const targetCenter = isHorizontalEdge
    ? targetRect.x + targetRect.width / 2 - position.left
    : targetRect.y + targetRect.height / 2 - position.top;
  const edgeLength = isHorizontalEdge ? bubbleSize.width : bubbleSize.height;

  const min = BUBBLE_TAIL_EDGE_MARGIN_PX;
  const max = Math.max(edgeLength - BUBBLE_TAIL_EDGE_MARGIN_PX, min);
  return Math.max(min, Math.min(targetCenter, max));
}
