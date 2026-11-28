import { Injectable } from '@nestjs/common';
import { RoomQueryService } from './room-query.service';
import { RoomRepository } from '../repository/room.repository';
import { TimerKey, TimerScheduler } from '../scheduler/timer.scheduler';
import { SseService } from './sse.service';
import { RoomDto } from '../dto/room.dto';

@Injectable()
export class ResetPomodoroService {
  constructor(
    private readonly roomQueryService: RoomQueryService,
    private readonly roomRepository: RoomRepository,
    private readonly timerScheduler: TimerScheduler,
    private readonly sseService: SseService,
  ) {}

  // 동시 리셋·시작 요청이 순서대로 처리되도록 await 없이 처리한다.
  // 대기로 돌아가므로 예약된 세션 종료를 반드시 취소하고 다시 예약하지 않는다
  resetPomodoro(roomId: string, participantId: string): void {
    const room = this.roomQueryService.findExistingRoom(roomId);

    room.resetPomodoro(participantId);
    this.roomRepository.save(room);

    this.timerScheduler.cancel(TimerKey.session(roomId));
    // 리셋으로 바뀐 상태는 별도 타입으로 보내 web이 세션 전환 알림을 건너뛰게 한다
    this.sseService.emit(roomId, {
      type: 'pomodoro_reset',
      data: RoomDto.fromEntity(room),
    });
  }
}
