import type { Notification } from './notification';

// 운영 알림 포트. 디스코드 같은 외부 채널 타입을 드러내지 않는다.
export abstract class NotificationSender {
  abstract send(notification: Notification): Promise<void>;
}
