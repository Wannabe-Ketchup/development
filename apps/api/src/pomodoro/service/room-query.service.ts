import { Injectable, NotFoundException } from '@nestjs/common';
import type { Room } from '@pomodoro/shared';
import { RoomRepository } from '../repository/room.repository';
import { Room as RoomEntity } from '../domain/room.entity';

@Injectable()
export class RoomQueryService {
  constructor(private readonly roomRepository: RoomRepository) {}

  findExistingRoom(roomId: string): RoomEntity {
    const room = this.roomRepository.findById(roomId);

    if (!room) {
      throw new NotFoundException('존재하지 않는 방입니다.');
    }

    return room;
  }

  toRoom(room: RoomEntity): Room {
    return {
      roomId: room.roomId,
      mode: room.mode,
      currentCycle: room.currentCycle,
      timer: room.timer,
      participants: [...room.participants.values()].map((participant) => ({
        id: participant.id,
        nickname: participant.nickname,
        statusMessage: participant.statusMessage,
        currentCycle: participant.currentCycle,
      })),
    };
  }
}
