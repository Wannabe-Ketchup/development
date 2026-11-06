import { Injectable } from '@nestjs/common';
import { RoomRepository } from '../repository/room.repository';
import { SseService } from './sse.service';
import { RoomDto } from '../dto/room.dto';
import { TimerKey, TimerScheduler } from '../scheduler/timer.scheduler';
import { TIMER_EVENT } from '../constant/timer-event.constant';
import { EMPTY_ROOM_DELETION_DELAY_SEC } from '../constant/room-deletion.constant';

@Injectable()
export class LeaveRoomService {
  constructor(
    private readonly roomRepository: RoomRepository,
    private readonly sseService: SseService,
    private readonly timerScheduler: TimerScheduler,
  ) {}

  leaveRoom(roomId: string, participantId: string): void {
    const room = this.roomRepository.findById(roomId);
    if (!room) {
      return;
    }

    room.leave(participantId);
    this.roomRepository.save(room);
    this.sseService.emit(roomId, {
      type: 'room_state',
      data: RoomDto.fromEntity(room),
    });

    if (room.isEmpty()) {
      this.timerScheduler.register(
        TimerKey.roomDeletion(roomId),
        TIMER_EVENT.ROOM_DELETION_TIMEOUT,
        { roomId },
        EMPTY_ROOM_DELETION_DELAY_SEC,
      );
    }
  }
}
