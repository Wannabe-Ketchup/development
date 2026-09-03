import type { Room } from './room.js';

export const SSE_EVENT_TYPES = ['room_state'] as const;
export type SseEventType = (typeof SSE_EVENT_TYPES)[number];
export interface SseEventDataMap {
  room_state: Room;
}
export type SseEventPayload = {
  [K in keyof SseEventDataMap]: {
    type: K;
    data: SseEventDataMap[K];
  };
}[keyof SseEventDataMap];
