import { SSE_EVENT_TYPES } from '@pomodoro/shared';
import type { SseEventPayload } from '@pomodoro/shared';
import { loginGuest } from './auth';

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
  const url = `/api/sse/pomodoro/${roomId}`;
  let eventSource: EventSource;
  let canReconnect = true;
  let isClosedByCaller = false;

  const connect = () => {
    eventSource = new EventSource(url);

    eventSource.onopen = () => {
      canReconnect = true;
      callbacks.onOpen?.();
    };

    eventSource.onerror = (error) => {
      // 401 등으로 서버가 연결을 거절하면 브라우저는 재연결하지 않고 CLOSED가 된다.
      const isRejected = eventSource.readyState === EventSource.CLOSED;
      if (!isRejected || !canReconnect) {
        callbacks.onError?.(error);
        return;
      }
      canReconnect = false;
      loginGuest()
        .then(() => {
          if (!isClosedByCaller) connect();
        })
        .catch(() => callbacks.onError?.(error));
    };

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
  };

  connect();

  return {
    close: () => {
      isClosedByCaller = true;
      eventSource.close();
    },
  };
}
