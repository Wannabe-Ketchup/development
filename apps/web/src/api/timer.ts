import type { ChangeTimerDurationRequest } from '@pomodoro/shared';
import { api } from './http';

const HTTP_STATUS_CONFLICT = 409;

type TimerAction = 'start' | 'pause' | 'resume';

async function requestTimerAction(
  roomId: string,
  action: TimerAction,
  errorMessage: string,
): Promise<void> {
  const response = await api(
    `/api/pomodoro/room/${roomId}/participant/pomodoro-${action}`,
    { method: 'POST' },
  );

  // 409는 이미 누군가 같은 조작을 한 경우다. 진행 상태는 SSE로 들어오므로 성공과 같이 처리한다
  if (response.status === HTTP_STATUS_CONFLICT) return;

  if (!response.ok) {
    throw new Error(errorMessage);
  }
}

export function startPomodoro(roomId: string): Promise<void> {
  return requestTimerAction(roomId, 'start', '뽀모도로를 시작하지 못했습니다.');
}

export function pausePomodoro(roomId: string): Promise<void> {
  return requestTimerAction(
    roomId,
    'pause',
    '뽀모도로를 일시정지하지 못했습니다.',
  );
}

export function resumePomodoro(roomId: string): Promise<void> {
  return requestTimerAction(
    roomId,
    'resume',
    '뽀모도로를 재개하지 못했습니다.',
  );
}

export type ChangeTimerDurationResult =
  { ok: true } | { ok: false; reason: 'running' | 'failed' };

// requestTimerAction과 달리 409를 성공으로 삼키지 않는다. 시작과 겹쳐 저장이 거절되면 사용자가 알아야 한다
export async function changeTimerDuration(
  roomId: string,
  body: ChangeTimerDurationRequest,
): Promise<ChangeTimerDurationResult> {
  try {
    const response = await api(
      `/api/pomodoro/room/${roomId}/participant/timer-duration`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      },
    );
    if (response.ok) return { ok: true };
    if (response.status === HTTP_STATUS_CONFLICT) {
      return { ok: false, reason: 'running' };
    }
    return { ok: false, reason: 'failed' };
  } catch {
    return { ok: false, reason: 'failed' };
  }
}
