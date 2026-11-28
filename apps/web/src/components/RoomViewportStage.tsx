import type { ReactNode } from 'react';
import { useViewportSize } from '@/hooks/useViewportSize';
import { getRoomViewportMode, type CompactLayout } from '@/lib/viewport-mode';

interface RoomViewportStageProps {
  children: ReactNode;
  renderCompact: (layout: CompactLayout) => ReactNode;
}

// 방의 화면 분기는 여기 한 곳에서만 한다. 방에는 안내 화면이 없고, 어느 화면도 비율로 줄이거나 스크롤하지 않는다
export function RoomViewportStage({
  children,
  renderCompact,
}: RoomViewportStageProps) {
  const size = useViewportSize();
  const viewportMode = getRoomViewportMode(size);

  switch (viewportMode.mode) {
    // mobile ↔ tablet은 같은 요소에 layout만 바뀌어 다시 마운트되지 않는다
    case 'compact':
      return renderCompact(viewportMode.layout);
    case 'desktop':
      return (
        <div
          data-testid="desktop-room"
          data-room-page
          className="fixed inset-0 overflow-hidden"
        >
          {children}
        </div>
      );
  }
}
