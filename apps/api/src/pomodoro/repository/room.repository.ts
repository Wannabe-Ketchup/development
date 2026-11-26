import { Room } from '../domain/room.entity';

export abstract class RoomRepository {
  abstract save(room: Room): void;

  abstract findById(roomId: string): Room | undefined;

  // 한 참여자는 한 번에 한 방에만 있으므로 찾은 방 하나를 돌려준다
  abstract findByParticipantId(participantId: string): Room | undefined;

  abstract delete(roomId: string): void;
}
