import { Injectable } from '@nestjs/common';
import { RoomRepository } from '../repository/room.repository';
import { RoomQueryService } from './room-query.service';
import { Room } from '../domain/room.entity';
import { JoinRoomResponse } from '../dto/join-room-response.dto';
import { CreateParticipantService } from './create-participant.service';

const NICKNAME_ADJECTIVES = ['졸린', '배고픈', '느긋한', '즐거운'];

@Injectable()
export class EnterRoomService {
  constructor(
    private readonly roomQueryService: RoomQueryService,
    private readonly roomRepository: RoomRepository,
    private readonly createParticipantService: CreateParticipantService,
  ) {}

  joinRoom(roomId: string): JoinRoomResponse {
    const room = this.roomQueryService.findExistingRoom(roomId);

    let nickname: string;
    do {
      nickname = this.generateRandomNickname();
    } while (room.hasNickname(nickname));

    const joinedAt = new Date().toISOString();
    const participant = this.createParticipantService.create(
      joinedAt,
      nickname,
    );
    room.join(participant);

    this.roomRepository.save(room);

    return {
      participant: { id: participant.id, nickname: participant.nickname },
      room: this.toRoom(room),
    };
  }

  private toRoom(room: Room): JoinRoomResponse['room'] {
    return {
      roomId: room.roomId,
      mode: room.mode,
      currentCycle: room.currentCycle,
      timer: room.timer,
      participants: [...room.participants.values()],
    };
  }

  private generateRandomNickname(): string {
    const adjective =
      NICKNAME_ADJECTIVES[
        Math.floor(Math.random() * NICKNAME_ADJECTIVES.length)
      ];

    return `${adjective}토마토`;
  }
}
