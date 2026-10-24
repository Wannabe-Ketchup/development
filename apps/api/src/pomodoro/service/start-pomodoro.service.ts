import { Injectable } from '@nestjs/common';
import { Clock } from '../../common/clock/clock';
import { RoomQueryService } from './room-query.service';
import { RoomRepository } from '../repository/room.repository';
import { TimerKey, TimerScheduler } from '../scheduler/timer.scheduler';
import { TIMER_EVENT } from '../constant/timer-event.constant';
import { SseService } from './sse.service';
import { RoomDto } from '../dto/room.dto';

@Injectable()
export class StartPomodoroService {
  constructor(
    private readonly roomQueryService: RoomQueryService,
    private readonly roomRepository: RoomRepository,
    private readonly timerScheduler: TimerScheduler,
    private readonly sseService: SseService,
    private readonly clock: Clock,
  ) {}

  // 동시 시작 요청 중 두 번째가 409가 되도록 await 없이 처리한다
  startPomodoro(roomId: string, participantId: string): void {
    const now = this.clock.now();
    const room = this.roomQueryService.findExistingRoom(roomId);

    room.startPomodoro(participantId, now);
    this.roomRepository.save(room);

    this.timerScheduler.register(
      TimerKey.session(roomId),
      TIMER_EVENT.FOCUS_TIMEOUT,
      { roomId },
      room.remainingSecondsInPhase(now),
    );
    this.sseService.emit(roomId, {
      type: 'room_state',
      data: RoomDto.fromEntity(room),
    });
  }
}
