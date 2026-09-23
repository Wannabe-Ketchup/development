import type { Room } from '@pomodoro/shared';

export interface JoinRoomResponse {
  participant: { id: string; nickname: string };
  room: Room;
}

export async function enterRoom(
  roomId: string,
  participantId?: string,
): Promise<JoinRoomResponse> {
  const response = await fetch(`/api/pomodoro/room/${roomId}/participant`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(participantId ? { participantId } : {}),
  });

  if (!response.ok) {
    throw new Error('방 입장에 실패했습니다.');
  }

  return response.json() as Promise<JoinRoomResponse>;
}

// TODO: shared dto로 ErrorResponse 정의 필요
interface ErrorResponse { 
  statusCode: number, 
  message: string,
  error: string
}

export async function changeNickname(
  roomId: string,
  participantId: string,
  nickname: string,
): Promise<void> {
  const response = await fetch(
    `/api/pomodoro/room/${roomId}/participant/${participantId}/nickname`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nickname }),
    },
  );

  if (!response.ok) {
    if (response.status >= 500) throw new Error('닉네임을 변경하지 못했습니다.')
    const body: ErrorResponse = await response.json()
    throw new Error(body.message);
  }
}
