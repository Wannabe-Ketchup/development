import { ROOM_MODE } from '@pomodoro/shared';
import type { Room } from '@pomodoro/shared';
import { getRemainingTimeSec } from './remaining-time';
import { formatSessionLabel } from './session-label';

const IDLE_TAB_TITLE = '대기 중';
const PAUSED_TAB_TITLE = '일시정지';
const SECONDS_PER_MINUTE = 60;

// 'MM:SS' (화면 타이머의 'MM : SS'와 달리 공백 없음)
function formatTabTime(totalSec: number): string {
  const minutes = Math.floor(totalSec / SECONDS_PER_MINUTE);
  const seconds = totalSec % SECONDS_PER_MINUTE;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

// 대기 → '대기 중', 일시정지 → '일시정지', 진행 중 → '12:34 · 1st focus'
export function formatTabTitle(
  room: Pick<Room, 'timer' | 'mode' | 'currentCycle'>,
  now: Date,
): string {
  if (room.mode === ROOM_MODE.IDLE) return IDLE_TAB_TITLE;
  if (room.timer.status === 'PAUSED') return PAUSED_TAB_TITLE;
  const remainingSec = getRemainingTimeSec(room.timer, now);
  return `${formatTabTime(remainingSec)} · ${formatSessionLabel(room.currentCycle, room.mode)}`;
}
