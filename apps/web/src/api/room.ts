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
