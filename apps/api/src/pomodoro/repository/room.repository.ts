import { Room } from '../domain/room.entity';

export abstract class RoomRepository {
  abstract save(room: Room): void;

  abstract findById(roomId: string): Room | undefined;

  abstract delete(roomId: string): void;
}
