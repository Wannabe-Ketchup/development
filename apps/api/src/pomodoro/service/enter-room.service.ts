import { Injectable } from '@nestjs/common';
import { RoomRepository } from '../repository/room.repository';
import { RoomQueryService } from './room-query.service';
import { RoomPresenceService } from './room-presence.service';
import { JoinRoomResponse } from '../dto/join-room-response.dto';
import { CreateParticipantService } from './create-participant.service';

const NICKNAME_ADJECTIVES = ['졸린', '배고픈', '느긋한', '즐거운'];

@Injectable()
export class EnterRoomService {
  constructor(
    private readonly roomQueryService: RoomQueryService,
    private readonly roomRepository: RoomRepository,
    private readonly createParticipantService: CreateParticipantService,
    private readonly roomPresenceService: RoomPresenceService,
  ) {}

  joinRoom(roomId: string, participantId?: string): JoinRoomResponse {
    const room = this.roomQueryService.findExistingRoom(roomId);

    const existingParticipant = participantId
      ? room.participants.get(participantId)
      : undefined;
    if (existingParticipant) {
      return {
        participant: {
          id: existingParticipant.id,
          nickname: existingParticipant.nickname,
        },
        room: this.roomQueryService.toRoom(room),
      };
    }

    let nickname: string;
    do {
      nickname = this.generateRandomNickname();
    } while (room.hasNickname(nickname));

    const joinedAt = new Date().toISOString();
    const participant = this.createParticipantService.create(
      nickname,
      joinedAt,
    );
    room.join(participant);

    this.roomRepository.save(room);
    this.roomPresenceService.registerPendingParticipant(roomId, participant.id);

    return {
      participant: { id: participant.id, nickname: participant.nickname },
      room: this.roomQueryService.toRoom(room),
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
