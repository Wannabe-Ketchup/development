import { Injectable } from '@nestjs/common';
import { RoomRepository } from '../repository/room.repository';
import { SseService } from './sse.service';
import { RoomDto } from '../dto/room.dto';

@Injectable()
export class LeaveRoomService {
  constructor(
    private readonly roomRepository: RoomRepository,
    private readonly sseService: SseService,
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
  }
}
