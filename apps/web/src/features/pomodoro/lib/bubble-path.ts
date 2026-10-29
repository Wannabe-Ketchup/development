import type { BubbleTail } from './bubble-placement';

export const BUBBLE_BORDER_RADIUS_PX = 16;
export const BUBBLE_TAIL_WIDTH_PX = 20;
export const BUBBLE_TAIL_HEIGHT_PX = 12;

export interface BubblePathInput {
  width: number;
  height: number;
  tail: BubbleTail | null;
  borderRadius?: number;
  tailWidth?: number;
  tailHeight?: number;
}

// 둥근 사각형 말풍선의 SVG path를 만든다. 꼬리는 본체와 하나의 닫힌 path로 이어 그린다.
// tail.placement는 말풍선이 타겟의 어느 쪽에 있는가를 뜻하므로, 꼬리는 그 반대편 변에서 타겟을 향해 나간다.
// (bottom → 위쪽 변, top → 아래쪽 변, right → 왼쪽 변, left → 오른쪽 변)
export function buildBubblePath({
  width,
  height,
  tail,
  borderRadius = BUBBLE_BORDER_RADIUS_PX,
  tailWidth = BUBBLE_TAIL_WIDTH_PX,
  tailHeight = BUBBLE_TAIL_HEIGHT_PX,
}: BubblePathInput): string {
  if (width <= 0 || height <= 0) return '';

  const r = Math.min(borderRadius, width / 2, height / 2);
  const halfTail = tailWidth / 2;

  // 꼬리 밑변이 모서리 둥글기 구간에 걸치지 않도록 변 위의 위치를 제한한다.
  const clampOffset = (offset: number, edgeLength: number) =>
    Math.max(r + halfTail, Math.min(offset, edgeLength - r - halfTail));

  const tailOn = (edge: 'top' | 'right' | 'bottom' | 'left') => {
    if (!tail) return false;
    const edgeByPlacement = {
      bottom: 'top',
      top: 'bottom',
      right: 'left',
      left: 'right',
    } as const;
    return edgeByPlacement[tail.placement] === edge;
  };

  const horizontalOffset = tail ? clampOffset(tail.offset, width) : 0;
  const verticalOffset = tail ? clampOffset(tail.offset, height) : 0;

  const commands: string[] = [`M ${r} 0`];

  // 위쪽 변 (왼쪽 → 오른쪽)
  if (tailOn('top')) {
    commands.push(
      `L ${horizontalOffset - halfTail} 0`,
      `L ${horizontalOffset} ${-tailHeight}`,
      `L ${horizontalOffset + halfTail} 0`,
    );
  }
  commands.push(`L ${width - r} 0`, `Q ${width} 0 ${width} ${r}`);

  // 오른쪽 변 (위 → 아래)
  if (tailOn('right')) {
    commands.push(
      `L ${width} ${verticalOffset - halfTail}`,
      `L ${width + tailHeight} ${verticalOffset}`,
      `L ${width} ${verticalOffset + halfTail}`,
    );
  }
  commands.push(
    `L ${width} ${height - r}`,
    `Q ${width} ${height} ${width - r} ${height}`,
  );

  // 아래쪽 변 (오른쪽 → 왼쪽)
  if (tailOn('bottom')) {
    commands.push(
      `L ${horizontalOffset + halfTail} ${height}`,
      `L ${horizontalOffset} ${height + tailHeight}`,
      `L ${horizontalOffset - halfTail} ${height}`,
    );
  }
  commands.push(`L ${r} ${height}`, `Q 0 ${height} 0 ${height - r}`);

  // 왼쪽 변 (아래 → 위)
  if (tailOn('left')) {
    commands.push(
      `L 0 ${verticalOffset + halfTail}`,
      `L ${-tailHeight} ${verticalOffset}`,
      `L 0 ${verticalOffset - halfTail}`,
    );
  }
  commands.push(`L 0 ${r}`, `Q 0 0 ${r} 0`, 'Z');

  return commands.join(' ');
}
