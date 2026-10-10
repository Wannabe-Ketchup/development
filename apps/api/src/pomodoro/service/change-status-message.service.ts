import { Injectable } from '@nestjs/common';
import { RoomQueryService } from './room-query.service';
import { RoomRepository } from '../repository/room.repository';
import { SseService } from './sse.service';
import { RoomDto } from '../dto/room.dto';

@Injectable()
export class ChangeStatusMessageService {
  constructor(
    private readonly roomQueryService: RoomQueryService,
    private readonly roomRepository: RoomRepository,
    private readonly sseService: SseService,
  ) {}

  changeStatusMessage(
    roomId: string,
    participantId: string,
    statusMessage: string,
  ): void {
    const room = this.roomQueryService.findExistingRoom(roomId);

    room.changeStatusMessage(participantId, statusMessage);
    this.roomRepository.save(room);

    this.sseService.emit(roomId, {
      type: 'room_state',
      data: RoomDto.fromEntity(room),
    });
  }
}
