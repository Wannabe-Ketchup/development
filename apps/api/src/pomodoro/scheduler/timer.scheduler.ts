import {
  TimerEventName,
  TimerEventPayload,
} from '../constant/timer-event.constant';

export abstract class TimerScheduler {
  // 같은 key로 다시 등록하면 기존 타이머를 교체한다.
  abstract register<E extends TimerEventName>(
    key: string,
    eventName: E,
    payload: TimerEventPayload[E],
    delaySec: number,
  ): void;

  // 없는 key를 취소해도 에러가 나지 않는다.
  abstract cancel(key: string): void;
}

// 등록하는 서비스와 취소하는 서비스가 같은 key를 다시 만들 수 있도록 형식을 한 곳에서 정한다.
export const TimerKey = {
  session: (roomId: string) => `room:${roomId}:session`,
  // 입장 대기 타이머는 참가자마다 걸려서 한 방에 여러 개가 생긴다. 그래서 취소 기준을 roomId가 아닌 key로 정했다.
  // 후속 리팩터링(RoomPresenceService)에서 사용한다.
  presence: (roomId: string, participantId: string) =>
    `room:${roomId}:presence:${participantId}`,
};
