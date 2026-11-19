import { Injectable } from '@nestjs/common';
import { RoomQueryService } from './room-query.service';
import { RoomRepository } from '../repository/room.repository';
import { SseService } from './sse.service';
import { RoomDto } from '../dto/room.dto';

@Injectable()
export class ChangeTimerDurationService {
  constructor(
    private readonly roomQueryService: RoomQueryService,
    private readonly roomRepository: RoomRepository,
    private readonly sseService: SseService,
  ) {}

  // 시작 요청과 겹쳐도 먼저 처리된 쪽만 반영되도록 await 없이 처리한다
  changeTimerDuration(
    roomId: string,
    participantId: string,
    focusMinutes: number,
    breakMinutes: number,
  ): void {
    const room = this.roomQueryService.findExistingRoom(roomId);

    room.changeTimerDuration(participantId, focusMinutes, breakMinutes);
    this.roomRepository.save(room);

    this.sseService.emit(roomId, {
      type: 'room_state',
      data: RoomDto.fromEntity(room),
    });
  }
}
