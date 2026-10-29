import { Injectable } from '@nestjs/common';
import { Clock } from '../../common/clock/clock';
import { RoomQueryService } from './room-query.service';
import { RoomRepository } from '../repository/room.repository';
import { TimerKey, TimerScheduler } from '../scheduler/timer.scheduler';
import { SseService } from './sse.service';
import { RoomDto } from '../dto/room.dto';

@Injectable()
export class PausePomodoroService {
  constructor(
    private readonly roomQueryService: RoomQueryService,
    private readonly roomRepository: RoomRepository,
    private readonly timerScheduler: TimerScheduler,
    private readonly sseService: SseService,
    private readonly clock: Clock,
  ) {}

  // 동시 일시정지 요청 중 두 번째가 409가 되도록 await 없이 처리한다
  pausePomodoro(roomId: string, participantId: string): void {
    const room = this.roomQueryService.findExistingRoom(roomId);

    room.pausePomodoro(participantId, this.clock.now());
    this.roomRepository.save(room);

    this.timerScheduler.cancel(TimerKey.session(roomId));
    this.sseService.emit(roomId, {
      type: 'room_state',
      data: RoomDto.fromEntity(room),
    });
  }
}
