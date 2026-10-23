import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import { Room } from '../domain/room.entity';
import { RoomRepository } from '../repository/room.repository';

@Injectable()
export class CreateRoomService {
  constructor(private readonly roomRepository: RoomRepository) {}

  public create(): string {
    const roomId = crypto.randomUUID();
    const room = Room.create(roomId);
    this.roomRepository.save(room);

    return roomId;
  }
}
