import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  TIMER_EVENT,
  type TimerEventPayload,
} from '../constant/timer-event.constant';
import { FinishFocusService } from '../service/finish-focus.service';
import { FinishBreakService } from '../service/finish-break.service';

type SessionTimeoutPayload =
  TimerEventPayload[typeof TIMER_EVENT.FOCUS_TIMEOUT];

// 타이머 만료 이벤트의 진입점. 서비스 호출만 한다.
// 리스너에서 난 예외는 event-emitter의 suppressErrors(기본 true)가 로그로 남긴다.
@Injectable()
export class PomodoroTimerListener {
  constructor(
    private readonly finishFocusService: FinishFocusService,
    private readonly finishBreakService: FinishBreakService,
  ) {}

  @OnEvent(TIMER_EVENT.FOCUS_TIMEOUT)
  handleFocusTimeout({ roomId }: SessionTimeoutPayload): void {
    this.finishFocusService.finishFocus(roomId);
  }

  @OnEvent(TIMER_EVENT.BREAK_TIMEOUT)
  handleBreakTimeout({ roomId }: SessionTimeoutPayload): void {
    this.finishBreakService.finishBreak(roomId);
  }
}
