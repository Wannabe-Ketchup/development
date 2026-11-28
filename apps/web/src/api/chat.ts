import type {
  SendChatMessageRequest,
  SendChatMessageResponse,
} from '@pomodoro/shared';
import { api } from './http';

const TOO_MANY_REQUESTS_STATUS = 429;
// 조용히 끊긴 연결에서는 응답도 오류도 오지 않아, 이만큼 기다린 뒤 실패로 본다
const SEND_TIMEOUT_MS = 10_000;
const SEND_CHAT_MESSAGE_FAILED_MESSAGE = '메시지를 보내지 못했습니다.';

// rate-limited: 429 너무 자주 보냄 / unknown: 그 밖의 status, 네트워크 오류, 시간 초과
export type SendChatMessageFailureReason = 'rate-limited' | 'unknown';

export class SendChatMessageError extends Error {
  readonly reason: SendChatMessageFailureReason;

  constructor(reason: SendChatMessageFailureReason) {
    super(SEND_CHAT_MESSAGE_FAILED_MESSAGE);
    this.name = 'SendChatMessageError';
    this.reason = reason;
  }
}

export async function sendChatMessage(
  roomId: string,
  request: SendChatMessageRequest,
): Promise<SendChatMessageResponse> {
  const response = await api(
    `/api/pomodoro/room/${encodeURIComponent(roomId)}/chat-message`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
      signal: AbortSignal.timeout(SEND_TIMEOUT_MS),
    },
  ).catch(() => {
    throw new SendChatMessageError('unknown');
  });

  if (response.ok) {
    return response.json() as Promise<SendChatMessageResponse>;
  }
  throw new SendChatMessageError(
    response.status === TOO_MANY_REQUESTS_STATUS ? 'rate-limited' : 'unknown',
  );
}
