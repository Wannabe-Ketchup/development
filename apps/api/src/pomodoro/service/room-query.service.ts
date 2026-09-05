import { Injectable, NotFoundException } from '@nestjs/common';
import { RoomRepository } from '../repository/room.repository';
import { Room } from '../domain/room.entity';

@Injectable()
export class RoomQueryService {
  constructor(private readonly roomRepository: RoomRepository) {}

  findExistingRoom(roomId: string): Room {
    const room = this.roomRepository.findById(roomId);

    if (!room) {
      throw new NotFoundException('존재하지 않는 방입니다.');
    }

    return room;
  }
}
