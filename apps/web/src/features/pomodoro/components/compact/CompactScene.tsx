import type { ReactNode } from 'react';
import type { RoomMode } from '@pomodoro/shared';
import DeskSvg from '@/assets/desk.svg?react';
import { DeskProps } from '../DeskProps';

interface CompactSceneProps {
  // 장면에 앉은 참여자. 책상 위 소품이 이 순서로 놓인다
  participantIds: string[];
  mode: RoomMode;
  // 소품의 좌석 위치. 폰은 넘기는 위치를, 중간 화면은 기본 좌석 위치를 쓴다
  getSeatTranslateX?: (index: number) => number;
  // 참여자 목록(ul)
  children: ReactNode;
}

// 책상과 참여자를 데스크톱과 같은 크기로 그린다. 줄이지 않아 화면이 좁으면 양옆이 잘린다.
// 기준점은 방의 벽·바닥 경계(60%)보다 24px 아래다. 낮은 화면에서도 상태 메시지가 타이머에 덜 닿게 데스크톱보다 내린다.
// 안쪽 좌표는 데스크톱 page.tsx의 "60% + N px"와 같은 N이다
export function CompactScene({
  participantIds,
  mode,
  getSeatTranslateX,
  children,
}: CompactSceneProps) {
  return (
    <div className="absolute top-[calc(60%+24px)] left-1/2 z-4 h-0 w-0">
      {/* 기준점의 너비가 0이라 w-max로 책상 크기를 지킨다 */}
      <div className="absolute top-[57px] left-0 z-10 w-max -translate-x-1/2">
        <div className="relative">
          <DeskSvg aria-hidden="true" className="h-auto w-210 max-w-none" />
          <DeskProps
            mode={mode}
            participantIds={participantIds}
            getTranslateX={getSeatTranslateX}
          />
        </div>
      </div>
      {children}
    </div>
  );
}
