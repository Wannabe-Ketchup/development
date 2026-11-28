import type { RoomMode, TimerStatus } from '@pomodoro/shared';
import { cn } from '@/lib/cn';
import { formatSessionLabel } from '../lib/session-label';
import { PausePomodoroButton } from './PausePomodoroButton';
import { ResetPomodoroButton } from './ResetPomodoroButton';
import { ResumePomodoroButton } from './ResumePomodoroButton';
import { SessionLabel } from './SessionLabel';
import { SquigglePill } from '@/components/SquigglePill';
import { StartPomodoroButton } from './StartPomodoroButton';

interface PomodoroSessionProps {
  roomId: string;
  mode: RoomMode;
  currentCycle: number;
  timerStatus: TimerStatus;
  // 놓이는 쪽이 간격을 바꿀 때 쓴다
  className?: string;
  // 좁은 화면 하단 조작 줄. 회차 라벨을 작은 글자 알약으로 바꾸고 간격을 좁힌다
  isCompact?: boolean;
}

// 단계 라벨은 항상 보여주고, 조작 버튼은 타이머 상태에 따라 start, pause, resume 중 하나를 보여주고, 리셋 버튼은 항상 옆에 둔다
export function PomodoroSession({
  roomId,
  mode,
  currentCycle,
  timerStatus,
  className,
  isCompact = false,
}: PomodoroSessionProps) {
  return (
    <div
      className={cn(
        'flex items-center',
        isCompact ? 'gap-3' : 'gap-7',
        className,
      )}
    >
      <SessionLabel
        label={formatSessionLabel(currentCycle, mode)}
        isCompact={isCompact}
      />
      <div className={cn('flex items-center', isCompact ? 'gap-2' : 'gap-5.5')}>
        {/* 알약 테두리는 새로 마운트되면 크기를 잰 다음 프레임에야 그려져 깜빡이므로, 테두리는 유지하고 안의 버튼만 바꾼다 */}
        <SquigglePill>
          {timerStatus === 'IDLE' && <StartPomodoroButton roomId={roomId} />}
          {timerStatus === 'RUNNING' && <PausePomodoroButton roomId={roomId} />}
          {timerStatus === 'PAUSED' && <ResumePomodoroButton roomId={roomId} />}
        </SquigglePill>
        <ResetPomodoroButton
          roomId={roomId}
          isResettable={timerStatus !== 'IDLE'}
        />
      </div>
    </div>
  );
}
