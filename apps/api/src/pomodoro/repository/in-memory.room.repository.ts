import { Injectable } from '@nestjs/common';
import { Room } from '../domain/room.entity';
import { RoomRepository } from './room.repository';

@Injectable()
export class InMemoryRoomRepository extends RoomRepository {
  private readonly rooms = new Map<string, Room>();

  save(room: Room): void {
    this.rooms.set(room.roomId, room);
  }

  findById(roomId: string): Room | undefined {
    return this.rooms.get(roomId);
  }

  findByParticipantId(participantId: string): Room | undefined {
    for (const room of this.rooms.values()) {
      if (room.participants.has(participantId)) {
        return room;
      }
    }
    return undefined;
  }

  delete(roomId: string): void {
    this.rooms.delete(roomId);
  }
}
