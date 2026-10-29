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

  delete(roomId: string): void {
    this.rooms.delete(roomId);
  }
}
