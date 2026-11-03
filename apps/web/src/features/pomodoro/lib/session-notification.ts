import { ROOM_MODE, CYCLE_COUNT } from '@pomodoro/shared';
import type { Session } from '../hooks/useSessionChange';

export interface SessionNotification {
  title: string;
  options: NotificationOptions;
}

// (FOCUS, 1) → '1회차 집중 시작', (BREAK, 2) → '2회차 휴식 시작', (IDLE, *) → '4회차를 모두 마쳤어요'
// tag는 서버가 정한 세션 시작 시각까지 넣어 전환마다 다르다. 같은 방의 다음 세트에서 회차가 반복돼도
// 이전 알림이 조용히 교체되지 않고 새로 뜬다. 서버 값이라 같은 방 여러 탭의 같은 전환은 하나로 합쳐진다.
// sessionStartedAt: 새 세션의 시작 시각. 대기로 돌아왔을 때는 직전 세션의 시작 시각을 넘긴다.
export function buildSessionNotification(
  roomId: string,
  { mode, currentCycle }: Session,
  sessionStartedAt: string | null,
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
      tag: `pomodoro:${roomId}:${mode}:${currentCycle}:${sessionStartedAt}`,
      silent: true,
    },
  };
}
