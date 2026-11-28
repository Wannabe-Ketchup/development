import type { ReactNode } from 'react';
import type { RoomMode, TimerStatus } from '@pomodoro/shared';
import { PomodoroSession } from '../PomodoroSession';

interface CompactControlBarProps {
  roomId: string;
  mode: RoomMode;
  currentCycle: number;
  timerStatus: TimerStatus;
  // 오른쪽 끝에 놓을 것(채팅 버튼)
  children?: ReactNode;
}

// 하단 조작 줄. 왼쪽에 회차 라벨·시작/일시정지·리셋, 오른쪽 끝에 채팅 버튼을 둔다.
// 홈 인디케이터 위로 16px 띄운다
export function CompactControlBar({
  roomId,
  mode,
  currentCycle,
  timerStatus,
  children,
}: CompactControlBarProps) {
  return (
    <div className="absolute inset-x-0 bottom-[calc(var(--safe-bottom)+16px)] z-9 flex h-12 items-center justify-between pr-[max(var(--side),var(--safe-right))] pl-[max(var(--side),var(--safe-left))]">
      <div data-tour-id="timer-controls">
        <PomodoroSession
          roomId={roomId}
          mode={mode}
          currentCycle={currentCycle}
          timerStatus={timerStatus}
          isCompact
        />
      </div>
      {children}
    </div>
  );
}
