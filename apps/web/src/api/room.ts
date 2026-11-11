import type {
  CreateRoomResponse,
  EnterRoomByInviteCodeRequest,
  ExistsRoomResponse,
  InviteCodeResponse,
  JoinRoomResponse,
} from '@pomodoro/shared';
import { api } from './http';

const BAD_REQUEST_STATUS = 400;
const NOT_FOUND_STATUS = 404;
const ENTER_ROOM_FAILED_MESSAGE = '방 입장에 실패했습니다.';

// 방 링크의 roomId로 입장한다
export async function enterRoom(roomId: string): Promise<JoinRoomResponse> {
  const response = await api(
    `/api/pomodoro/room/${encodeURIComponent(roomId)}/participant`,
    { method: 'POST' },
  );

  if (!response.ok) {
    throw new Error(ENTER_ROOM_FAILED_MESSAGE);
  }

  return response.json() as Promise<JoinRoomResponse>;
}

// not-found: 없는·틀린 초대코드 / rejected: 서버가 입장을 거절(정원 초과) / unknown: 그 밖의 실패
export type EnterRoomFailureReason = 'not-found' | 'rejected' | 'unknown';

export class EnterRoomError extends Error {
  readonly reason: EnterRoomFailureReason;

  constructor(reason: EnterRoomFailureReason, message: string) {
    super(message);
    this.name = 'EnterRoomError';
    this.reason = reason;
  }
}

// 메인 화면에서 입력한 초대코드로 입장한다. 응답의 room.roomId가 실제 방 ID다
export async function enterRoomByInviteCode(
  inviteCode: string,
): Promise<JoinRoomResponse> {
  const request: EnterRoomByInviteCodeRequest = { inviteCode };
  const response = await api('/api/pomodoro/room/participant/invite-code', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  if (response.ok) {
    return response.json() as Promise<JoinRoomResponse>;
  }
  if (response.status === NOT_FOUND_STATUS) {
    throw new EnterRoomError('not-found', ENTER_ROOM_FAILED_MESSAGE);
  }
  if (response.status === BAD_REQUEST_STATUS) {
    const body = (await response
      .json()
      .catch(() => null)) as ErrorResponse | null;
    throw new EnterRoomError(
      'rejected',
      body?.message ?? ENTER_ROOM_FAILED_MESSAGE,
    );
  }
  throw new EnterRoomError('unknown', ENTER_ROOM_FAILED_MESSAGE);
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

export async function findInviteCode(
  roomId: string,
): Promise<InviteCodeResponse> {
  const response = await api(
    `/api/pomodoro/room/${encodeURIComponent(roomId)}/invite-code`,
  );

  if (!response.ok) {
    throw new Error('초대코드를 불러오지 못했습니다.');
  }

  return response.json() as Promise<InviteCodeResponse>;
}
