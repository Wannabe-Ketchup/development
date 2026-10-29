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
