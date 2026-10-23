export const TIMER_EVENT = {
  FOCUS_TIMEOUT: 'timer.pomodoro.focus.timeout',
  BREAK_TIMEOUT: 'timer.pomodoro.break.timeout',
  // 후속 리팩터링(RoomPresenceService의 입장 대기 setTimeout 교체)에서 사용할 이벤트
  PRESENCE_TIMEOUT: 'timer.room.presence.timeout',
} as const;

// 이벤트 이름마다 함께 발행되는 payload 타입
export interface TimerEventPayload {
  [TIMER_EVENT.FOCUS_TIMEOUT]: { roomId: string };
  [TIMER_EVENT.BREAK_TIMEOUT]: { roomId: string };
  [TIMER_EVENT.PRESENCE_TIMEOUT]: { roomId: string; participantId: string };
}

// payload가 정의된 이벤트만 사용할 수 있다.
export type TimerEventName = keyof TimerEventPayload;
