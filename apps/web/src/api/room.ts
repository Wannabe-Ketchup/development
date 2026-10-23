import type {
  Room,
  CreateRoomResponse,
  ExistsRoomResponse,
} from '@pomodoro/shared';
import { api } from './http';

export interface JoinRoomResponse {
  participant: { id: string; nickname: string };
  room: Room;
}

export async function enterRoom(roomId: string): Promise<JoinRoomResponse> {
  const response = await api(`/api/pomodoro/room/${roomId}/participant`, {
    method: 'POST',
  });

  if (!response.ok) {
    throw new Error('방 입장에 실패했습니다.');
  }

  return response.json() as Promise<JoinRoomResponse>;
}

// TODO: shared dto로 ErrorResponse 정의 필요
interface ErrorResponse {
  statusCode: number;
  message: string;
  error: string;
}

export async function changeNickname(
  roomId: string,
  nickname: string,
): Promise<void> {
  const response = await api(
    `/api/pomodoro/room/${roomId}/participant/nickname`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nickname }),
    },
  );

  if (!response.ok) {
    if (response.status >= 500)
      throw new Error('닉네임을 변경하지 못했습니다.');
    const body: ErrorResponse = await response.json();
    throw new Error(body.message);
  }
}

export async function createRoom(): Promise<CreateRoomResponse> {
  const response = await api(`/api/pomodoro/room`, {
    method: 'POST',
  });

  if (!response.ok) {
    throw new Error('방 생성에 실패했습니다.');
  }

  const data: CreateRoomResponse = await response.json();

  return data;
}

export async function existsRoom(roomId: string): Promise<ExistsRoomResponse> {
  const response = await api(
    `/api/pomodoro/room/${encodeURIComponent(roomId)}/exists`,
  );

  if (!response.ok) {
    throw new Error('방을 확인하지 못했습니다.');
  }

  return response.json() as Promise<ExistsRoomResponse>;
}

export async function changeStatusMessage(
  roomId: string,
  statusMessage: string,
): Promise<void> {
  const response = await api(
    `/api/pomodoro/room/${roomId}/participant/status-message`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ statusMessage }),
    },
  );

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.message || '상태메시지를 변경하지 못했습니다.');
  }
}
