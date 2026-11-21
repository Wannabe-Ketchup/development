import type { Room } from './room.js';

export const SSE_EVENT_TYPES = [
  'room_state',
  'pomodoro_reset',
  'heartbeat',
] as const;
export type SseEventType = (typeof SSE_EVENT_TYPES)[number];
export interface SseEventDataMap {
  room_state: Room;
  // 리셋으로 바뀐 방 상태. 데이터는 room_state와 같고, web은 이 이벤트로 바뀐 세션은 알리지 않는다
  pomodoro_reset: Room;
  // 연결이 살아 있음을 알린다. 받았다는 사실만 쓰므로 데이터는 비어 있다
  heartbeat: Record<string, never>;
}
export type SseEventPayload = {
  [K in keyof SseEventDataMap]: {
    type: K;
    data: SseEventDataMap[K];
  };
}[keyof SseEventDataMap];
