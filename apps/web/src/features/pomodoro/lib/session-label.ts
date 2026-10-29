import { ROOM_MODE } from '@pomodoro/shared';
import type { RoomMode } from '@pomodoro/shared';

function toOrdinal(cycle: number): string {
  switch (cycle) {
    case 1:
      return '1st';
    case 2:
      return '2nd';
    case 3:
      return '3rd';
    default:
      return `${cycle}th`;
  }
}

// 현재 단계를 라벨로 변환. 대기 중이면 'idle', 진행 중이면 "서수 + focus/break"
// (0, 'IDLE') → 'idle', (1, 'FOCUS') → '1st focus', (2, 'BREAK') → '2nd break'
export function formatSessionLabel(cycle: number, mode: RoomMode): string {
  if (mode === ROOM_MODE.IDLE) {
    return 'idle';
  }

  return `${toOrdinal(cycle)} ${mode.toLowerCase()}`;
}
