import { Injectable } from '@nestjs/common';
import { Clock } from '../../common/clock/clock';
import { RoomRepository } from '../repository/room.repository';
import { TimerKey, TimerScheduler } from '../scheduler/timer.scheduler';
import { TIMER_EVENT } from '../constant/timer-event.constant';
import { SseService } from './sse.service';
import { RoomDto } from '../dto/room.dto';

@Injectable()
export class FinishBreakService {
  constructor(
    private readonly roomRepository: RoomRepository,
    private readonly timerScheduler: TimerScheduler,
    private readonly sseService: SseService,
    private readonly clock: Clock,
  ) {}

  finishBreak(roomId: string): void {
    const room = this.roomRepository.findById(roomId);
    // 만료 시점에 방이 사라졌으면 알릴 대상이 없다. 방을 삭제할 때 세션 타이머를 취소하므로 보통은 여기 오지 않는다
    if (!room) {
      return;
    }

    room.finishBreak();
    this.roomRepository.save(room);

    // 마지막 회차 휴식이 끝나 대기 상태가 되면 다음 단계가 없다
    if (room.isRunning()) {
      this.timerScheduler.register(
        TimerKey.session(roomId),
        TIMER_EVENT.FOCUS_TIMEOUT,
        { roomId },
        room.remainingSecondsInPhase(this.clock.now()),
      );
    }
    this.sseService.emit(roomId, {
      type: 'room_state',
      data: RoomDto.fromEntity(room),
    });
  }
}
