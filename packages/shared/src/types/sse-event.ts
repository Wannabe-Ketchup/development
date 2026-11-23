import type { ChatHistory, ChatMessage } from './chat-message.js';
import type { Room } from './room.js';

export const SSE_EVENT_TYPES = [
  'room_state',
  'pomodoro_reset',
  'chat_message',
  'chat_history',
  'heartbeat',
] as const;
export type SseEventType = (typeof SSE_EVENT_TYPES)[number];
export interface SseEventDataMap {
  room_state: Room;
  // 리셋으로 바뀐 방 상태. 데이터는 room_state와 같고, web은 이 이벤트로 바뀐 세션은 알리지 않는다
  pomodoro_reset: Room;
  // 방에 새로 저장된 메시지 1개. 재전송은 다시 보내지 않는다
  chat_message: ChatMessage;
  // 입장 뒤 메시지 중 남아 있는 것. 연결마다 첫 room_state 바로 뒤에 1번 온다. 화면은 덮어쓰지 않고 id로 합친다
  chat_history: ChatHistory;
  // 연결이 살아 있음을 알린다. 받았다는 사실만 쓰므로 데이터는 비어 있다
  heartbeat: Record<string, never>;
}
export type SseEventPayload = {
  [K in keyof SseEventDataMap]: {
    type: K;
    data: SseEventDataMap[K];
  };
}[keyof SseEventDataMap];
