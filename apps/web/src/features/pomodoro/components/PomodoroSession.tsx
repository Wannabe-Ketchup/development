import { ROOM_MODE } from '@pomodoro/shared';
import type { RoomMode } from '@pomodoro/shared';
import { formatSessionLabel } from '../lib/session-label';
import { PausePomodoroButton } from './PausePomodoroButton';
import { SessionLabel } from './SessionLabel';
import { SquigglePill } from './SquigglePill';
import { StartPomodoroButton } from './StartPomodoroButton';

interface PomodoroSessionProps {
  roomId: string;
  mode: RoomMode;
  currentCycle: number;
}

// 단계 라벨은 항상 보여주고, 조작 버튼만 방 모드에 따라 start와 pause 중 하나를 보여준다
export function PomodoroSession({
  roomId,
  mode,
  currentCycle,
}: PomodoroSessionProps) {
  return (
    <div className="flex items-center gap-9">
      <SessionLabel label={formatSessionLabel(currentCycle, mode)} />
      {/* 알약 테두리는 새로 마운트되면 크기를 잰 다음 프레임에야 그려져 깜빡이므로, 테두리는 유지하고 안의 버튼만 바꾼다 */}
      <SquigglePill>
        {mode === ROOM_MODE.IDLE ? (
          <StartPomodoroButton roomId={roomId} />
        ) : (
          <PausePomodoroButton />
        )}
      </SquigglePill>
    </div>
  );
}
