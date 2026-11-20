import { useEffect, useState } from 'react';
import { createRoomSseConnection } from '../../../api/sse';
import type { Room, SseEventPayload } from '@pomodoro/shared';

export interface RoomStateChange {
  // 리셋으로 바뀐 방 상태인지. 리셋은 세션이 바뀌어도 알리지 않는다
  isReset: boolean;
}

type SSEStatus = 'connecting' | 'connected' | 'error';

// 방 입장이 끝난 뒤에만 연결한다. 입장 전에 연결하면 서버가 참가자를 찾지 못해 거절한다.
export function useRoomSSE(
  roomId: string | undefined,
  isEntered: boolean,
  onRoomState: (room: Room, change: RoomStateChange) => void,
) {
  const [status, setStatus] = useState<SSEStatus>('connecting');

  useEffect(() => {
    if (!roomId || !isEntered) return;

    setStatus('connecting');

    const connection = createRoomSseConnection(roomId, {
      onOpen: () => {
        setStatus('connected');
      },
      onMessage: (event: SseEventPayload) => {
        switch (event.type) {
          case 'room_state':
            onRoomState(event.data, { isReset: false });
            break;
          case 'pomodoro_reset':
            onRoomState(event.data, { isReset: true });
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
  }, [roomId, isEntered, onRoomState]);

  return { status };
}
