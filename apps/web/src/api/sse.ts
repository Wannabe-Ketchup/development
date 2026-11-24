import { SSE_EVENT_TYPES, SSE_HEARTBEAT_INTERVAL_MS } from '@pomodoro/shared';
import type { SseEventPayload } from '@pomodoro/shared';
import { loginGuest } from './auth';

// heartbeat를 3번 받지 못할 만큼 조용하면 조용히 끊긴 연결로 보고 다시 연결한다.
// 조용히 끊기면 브라우저는 끊긴 줄 몰라 스스로 다시 연결하지 않는다.
const SILENT_CONNECTION_TIMEOUT_MS = SSE_HEARTBEAT_INTERVAL_MS * 3;

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
  let silenceTimer: ReturnType<typeof setTimeout> | undefined;

  const stopWatchingSilence = () => {
    clearTimeout(silenceTimer);
  };

  // 무엇이든 받을 때마다 처음부터 다시 센다. 이미 기다린 뒤라 닫자마자 바로 다시 연결한다
  const watchSilence = () => {
    stopWatchingSilence();
    silenceTimer = setTimeout(() => {
      eventSource.close();
      connect();
    }, SILENT_CONNECTION_TIMEOUT_MS);
  };

  const connect = () => {
    eventSource = new EventSource(url);
    watchSilence();

    eventSource.onopen = () => {
      canReconnect = true;
      callbacks.onOpen?.();
    };

    eventSource.onerror = (error) => {
      // 401 등으로 서버가 연결을 거절하면 브라우저는 재연결하지 않고 CLOSED가 된다.
      const isRejected = eventSource.readyState === EventSource.CLOSED;
      if (isRejected) stopWatchingSilence();
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
        watchSilence();
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
      stopWatchingSilence();
      eventSource.close();
    },
  };
}
