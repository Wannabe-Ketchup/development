import { useEffect, useState } from 'react';
import { createRoomSseConnection } from '../../../api/sse';
import type { SseEventPayload } from '@pomodoro/shared';

type SSEStatus = 'connecting' | 'connected' | 'error';

export function useRoomSSE(roomId: string | undefined) {
  const [status, setStatus] = useState<SSEStatus>('connecting');

  useEffect(() => {
    if (!roomId) return;

    setStatus('connecting');

    const connection = createRoomSseConnection(roomId, {
      onOpen: () => {
        setStatus('connected');
      },
      onMessage: (event: SseEventPayload) => {
        // TODO: POMO-76, POMO-75 등의 티켓에서 이 곳에 비즈니스 로직(상태 업데이트) 구현
        switch (event.type) {
          case 'room_state':
            // setRoomStatus(event.data);
            break;
          default:
            break;
        }
      },
      onError: () => {
        setStatus('error');
      },
    });

    return () => {
      connection.close();
    };
  }, [roomId]);

  return { status };
}
