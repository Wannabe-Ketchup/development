import { useEffect, useRef, useState, type ReactNode } from 'react';
import { WobblySpeechBubble } from '@squiggle-line/react';
import { cn } from '@/lib/cn';

type Tail = 'bottom' | 'right';

interface PlacedSpeechBubbleProps {
  tail: Tail;
  // 테두리와 내용 사이 여백
  paddingPx: number;
  strokeWidthPx: number;
  pathClassName: string;
  children: ReactNode;
}

// WobblySpeechBubble 기본 꼬리 높이. 꼬리가 놓일 자리를 내용 옆에 비워 둔다
const TAIL_HEIGHT_PX = 20;

// 말풍선 틀과 내용을 따로 둔다. 틀은 내용이 없는 WobblySpeechBubble이라 꼬리 방향이 바뀌어도 내용은 같은 자리에 남아 다시 마운트되지 않는다.
// WobblySpeechBubble은 아래 꼬리만 그리므로, 오른쪽 꼬리는 틀을 -90° 돌려 그린다.
// 돌리기 전 틀의 빈 칸은 내용의 가로·세로를 바꾼 크기여야 돌린 뒤 내용과 맞는다.
export function PlacedSpeechBubble({
  tail,
  paddingPx,
  strokeWidthPx,
  pathClassName,
  children,
}: PlacedSpeechBubbleProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentSize, setContentSize] = useState({ width: 0, height: 0 });
  const isTailOnRight = tail === 'right';

  useEffect(() => {
    const element = contentRef.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setContentSize({ width, height });
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const frameSize = isTailOnRight
    ? { width: contentSize.height, height: contentSize.width }
    : contentSize;

  return (
    <div
      className="relative"
      style={{
        padding: paddingPx,
        // 꼬리가 놓일 자리를 내용 옆에 비워 둔다
        [isTailOnRight ? 'paddingRight' : 'paddingBottom']:
          paddingPx + TAIL_HEIGHT_PX,
      }}
    >
      <div
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute',
          isTailOnRight
            ? 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-90'
            : 'top-0 left-0',
        )}
      >
        <WobblySpeechBubble
          frequency={500}
          wiggle={3}
          smoothen={12}
          padding={paddingPx}
          borderRadius={16}
          strokeWidth={strokeWidthPx}
          tailHeight={TAIL_HEIGHT_PX}
          pathClassName={pathClassName}
        >
          <div style={frameSize} />
        </WobblySpeechBubble>
      </div>
      <div ref={contentRef} className="relative">
        {children}
      </div>
    </div>
  );
}
