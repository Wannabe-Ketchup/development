import { api } from './http';

const HTTP_STATUS_CONFLICT = 409;

export async function startPomodoro(roomId: string): Promise<void> {
  const response = await api(
    `/api/pomodoro/room/${roomId}/participant/pomodoro-start`,
    { method: 'POST' },
  );

  // 409는 이미 누군가 시작한 경우다. 진행 상태는 SSE로 들어오므로 성공과 같이 처리한다
  if (response.status === HTTP_STATUS_CONFLICT) return;

  if (!response.ok) {
    throw new Error('뽀모도로를 시작하지 못했습니다.');
  }
}
