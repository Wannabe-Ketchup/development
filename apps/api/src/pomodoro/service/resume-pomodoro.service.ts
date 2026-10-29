import { Injectable } from '@nestjs/common';
import { ROOM_MODE } from '@pomodoro/shared';
import { Clock } from '../../common/clock/clock';
import { RoomQueryService } from './room-query.service';
import { RoomRepository } from '../repository/room.repository';
import { TimerKey, TimerScheduler } from '../scheduler/timer.scheduler';
import { TIMER_EVENT } from '../constant/timer-event.constant';
import { SseService } from './sse.service';
import { RoomDto } from '../dto/room.dto';

@Injectable()
export class ResumePomodoroService {
  constructor(
    private readonly roomQueryService: RoomQueryService,
    private readonly roomRepository: RoomRepository,
    private readonly timerScheduler: TimerScheduler,
    private readonly sseService: SseService,
    private readonly clock: Clock,
  ) {}

  // 동시 재개 요청 중 두 번째가 409가 되도록 await 없이 처리한다
  resumePomodoro(roomId: string, participantId: string): void {
    const now = this.clock.now();
    const room = this.roomQueryService.findExistingRoom(roomId);

    room.resumePomodoro(participantId, now);
    this.roomRepository.save(room);

    // 멈췄던 단계가 끝날 때의 이벤트를 다시 건다
    const timeoutEvent =
      room.mode === ROOM_MODE.FOCUS
        ? TIMER_EVENT.FOCUS_TIMEOUT
        : TIMER_EVENT.BREAK_TIMEOUT;
    this.timerScheduler.register(
      TimerKey.session(roomId),
      timeoutEvent,
      { roomId },
      room.remainingSecondsInPhase(now),
    );
    this.sseService.emit(roomId, {
      type: 'room_state',
      data: RoomDto.fromEntity(room),
    });
  }
}
