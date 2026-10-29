import { Injectable } from '@nestjs/common';
import { RoomRepository } from '../repository/room.repository';
import { RoomQueryService } from './room-query.service';
import { RoomPresenceTracker } from './room-presence.tracker';
import { JoinRoomResponse } from '../dto/join-room-response.dto';
import { RoomDto } from '../dto/room.dto';
import { Participant } from '../domain/participant.entity';

const NICKNAME_ADJECTIVES = ['졸린', '배고픈', '느긋한', '즐거운', '멋진'];

@Injectable()
export class EnterRoomService {
  constructor(
    private readonly roomQueryService: RoomQueryService,
    private readonly roomRepository: RoomRepository,
    private readonly roomPresenceTracker: RoomPresenceTracker,
  ) {}

  // participantId는 로그인 세션의 값이다. 같은 세션이 다시 입장하면 기존 참가자를 돌려준다.
  joinRoom(roomId: string, participantId: string): JoinRoomResponse {
    const room = this.roomQueryService.findExistingRoom(roomId);

    const existingParticipant = room.participants.get(participantId);
    if (existingParticipant) {
      return {
        participant: {
          id: existingParticipant.id,
          nickname: existingParticipant.nickname,
        },
        room: RoomDto.fromEntity(room),
      };
    }

    let nickname: string;
    do {
      nickname = this.generateRandomNickname();
    } while (room.hasNickname(nickname));

    const joinedAt = new Date().toISOString();
    const participant = Participant.create(participantId, nickname, joinedAt);
    room.join(participant);

    this.roomRepository.save(room);
    this.roomPresenceTracker.registerPendingParticipant(roomId, participant.id);

    return {
      participant: { id: participant.id, nickname: participant.nickname },
      room: RoomDto.fromEntity(room),
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
