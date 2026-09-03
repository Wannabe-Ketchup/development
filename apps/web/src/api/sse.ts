import { SSE_EVENT_TYPES } from '@pomodoro/shared';
import type { SseEventPayload } from '@pomodoro/shared';
import { API_BASE_URL } from '../config/api';

export interface SseCallbacks {
  onMessage: (event: SseEventPayload) => void;
  onError?: (error: Event) => void;
  onOpen?: () => void;
}

export interface SseConnection {
  close: () => void;
}

export function createRoomSseConnection(
  roomId: string,
  callbacks: SseCallbacks,
): SseConnection {
  const url = `${API_BASE_URL}/sse/pomodoro/${roomId}`;
  const eventSource = new EventSource(url);

  if (callbacks.onOpen) {
    eventSource.onopen = callbacks.onOpen;
  }

  if (callbacks.onError) {
    eventSource.onerror = callbacks.onError;
  }

  SSE_EVENT_TYPES.forEach((type) => {
    eventSource.addEventListener(type, (e: MessageEvent) => {
      try {
        const parsedData = JSON.parse(e.data) as SseEventPayload['data'];

        callbacks.onMessage({ type, data: parsedData } as SseEventPayload);
      } catch (err) {
        console.error(`[SSE] ${type} 이벤트 데이터 파싱 실패:`, err);
      }
    });
  });

  return {
    close: () => {
      eventSource.close();
    },
  };
}
