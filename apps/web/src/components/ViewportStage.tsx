import type { ReactNode } from 'react';
import { StageScaleContext } from '@/hooks/useStageScale';
import { useViewportSize } from '@/hooks/useViewportSize';
import { getViewportMode } from '@/lib/viewport-mode';

interface ViewportStageProps {
  children: ReactNode;
  // 지원하지 않는 화면에서 children 대신 보여 줄 안내
  notice: ReactNode;
}

// 모드 분기는 여기 한 곳에서만 한다. unsupported이면 children을 마운트하지 않아 방에 입장하지 않는다.
export function ViewportStage({ children, notice }: ViewportStageProps) {
  const size = useViewportSize();
  const viewportMode = getViewportMode(size);

  switch (viewportMode.mode) {
    case 'full':
      return <div className="h-dvh w-dvw">{children}</div>;
    case 'scaled':
      return (
        <ScaledStage scale={viewportMode.scale} viewportSize={size}>
          {children}
        </ScaledStage>
      );
    case 'unsupported':
      return notice;
  }
}

interface ScaledStageProps {
  scale: number;
  viewportSize: { width: number; height: number };
  children: ReactNode;
}

// 화면을 1/scale배 키운 가상 뷰포트(항상 기준 크기 이상)에 기존 fluid 레이아웃을 그린 뒤 통째로 줄인다. 레터박스가 생기지 않는다.
function ScaledStage({ scale, viewportSize, children }: ScaledStageProps) {
  return (
    <div className="fixed inset-0 overflow-hidden">
      <div
        data-testid="scaled-stage"
        className="origin-top-left"
        style={{
          width: Math.ceil(viewportSize.width / scale),
          height: Math.ceil(viewportSize.height / scale),
          transform: `scale(${scale})`,
        }}
      >
        <StageScaleContext value={scale}>{children}</StageScaleContext>
      </div>
    </div>
  );
}
