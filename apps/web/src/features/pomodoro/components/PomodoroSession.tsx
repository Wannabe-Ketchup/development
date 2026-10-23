import { ROOM_MODE } from '@pomodoro/shared';
import type { RoomMode } from '@pomodoro/shared';
import { formatSessionLabel } from '../lib/session-label';
import { PausePomodoroButton } from './PausePomodoroButton';
import { SessionLabel } from './SessionLabel';
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
      {mode === ROOM_MODE.IDLE ? (
        <StartPomodoroButton roomId={roomId} />
      ) : (
        <PausePomodoroButton />
      )}
    </div>
  );
}
