import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  TimerEventName,
  TimerEventPayload,
} from '../constant/timer-event.constant';
import { TimerScheduler } from './timer.scheduler';

const MS_PER_SECOND = 1000;

@Injectable()
export class InMemoryTimerScheduler
  extends TimerScheduler
  implements OnModuleDestroy
{
  private readonly timers = new Map<string, NodeJS.Timeout>();

  constructor(private readonly eventEmitter: EventEmitter2) {
    super();
  }

  register<E extends TimerEventName>(
    key: string,
    eventName: E,
    payload: TimerEventPayload[E],
    delaySec: number,
  ): void {
    this.cancel(key);

    const timer = setTimeout(() => {
      // 리스너가 같은 key로 다음 타이머를 등록할 수 있으므로 emit보다 먼저 지운다.
      this.timers.delete(key);
      this.eventEmitter.emit(eventName, payload);
    }, delaySec * MS_PER_SECOND);

    this.timers.set(key, timer);
  }

  cancel(key: string): void {
    clearTimeout(this.timers.get(key));
    this.timers.delete(key);
  }

  // app.close() 시 남은 타이머를 정리한다 (jest open handle 방지).
  // enableShutdownHooks()가 없어서 운영 종료(SIGTERM) 시에는 호출되지 않는다.
  onModuleDestroy(): void {
    this.timers.forEach((timer) => clearTimeout(timer));
    this.timers.clear();
  }
}
