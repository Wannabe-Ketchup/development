import { useEffect, useState } from 'react';
import { createRoomSseConnection } from '../../../api/sse';
import type { Room, SseEventPayload } from '@pomodoro/shared';

type SSEStatus = 'connecting' | 'connected' | 'error';

export function useRoomSSE(
  roomId: string | undefined,
  participantId: string | undefined,
  onRoomState: (room: Room) => void,
) {
  const [status, setStatus] = useState<SSEStatus>('connecting');

  useEffect(() => {
    if (!roomId || !participantId) return;

    setStatus('connecting');

    const connection = createRoomSseConnection(roomId, participantId, {
      onOpen: () => {
        setStatus('connected');
      },
      onMessage: (event: SseEventPayload) => {
        switch (event.type) {
          case 'room_state':
            onRoomState(event.data);
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
  }, [roomId, participantId, onRoomState]);

  return { status };
}
