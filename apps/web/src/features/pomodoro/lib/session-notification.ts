import { ROOM_MODE, CYCLE_COUNT } from '@pomodoro/shared';
import type { Session } from '../hooks/useSessionChange';

export interface SessionNotification {
  title: string;
  options: NotificationOptions;
}

// (FOCUS, 1) → '1회차 집중 시작', (BREAK, 2) → '2회차 휴식 시작', (IDLE, *) → '4회차를 모두 마쳤어요'
// tag는 세션마다 달라 다음 세션 알림이 새로 뜨고, 같은 방 여러 탭의 같은 전환은 하나로 합쳐진다.
export function buildSessionNotification(
  roomId: string,
  { mode, currentCycle }: Session,
): SessionNotification {
  const title = (() => {
    switch (mode) {
      case ROOM_MODE.FOCUS:
        return `${currentCycle}회차 집중 시작`;
      case ROOM_MODE.BREAK:
        return `${currentCycle}회차 휴식 시작`;
      case ROOM_MODE.IDLE:
        return `${CYCLE_COUNT}회차를 모두 마쳤어요`;
    }
  })();

  return {
    title,
    options: {
      tag: `pomodoro:${roomId}:${mode}:${currentCycle}`,
      silent: true,
    },
  };
}
