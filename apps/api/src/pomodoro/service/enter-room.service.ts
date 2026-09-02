import { Injectable } from '@nestjs/common';
import { RoomRepository } from '../repository/room.repository';
import { RoomQueryService } from './room-query.service';
import { ParticipantService } from './participant.service';
import { Room } from '../domain/room.entity';
import { generateRandomNickname } from '../util/nickname.util';
import { JoinRoomResponse } from '../dto/join-room-response.dto';

@Injectable()
export class EnterRoomService {
  constructor(
    private readonly roomQueryService: RoomQueryService,
    private readonly roomRepository: RoomRepository,
    private readonly participantService: ParticipantService,
  ) {}

  joinRoom(roomId: string): JoinRoomResponse {
    const room = this.roomQueryService.findExistingRoom(roomId);

    room.validateCapacity();

    let nickname: string;
    do {
      nickname = generateRandomNickname();
    } while (room.hasNickname(nickname));

    const participant = this.participantService.createParticipant(nickname);
    room.join(participant);
    this.roomRepository.save(room);

    return {
      participant: { id: participant.id, nickname: participant.nickname },
      roomSnapshot: this.toRoomSnapshot(room),
    };
  }

  private toRoomSnapshot(room: Room): JoinRoomResponse['roomSnapshot'] {
    return {
      roomId: room.roomId,
      mode: room.mode,
      currentCycle: room.currentCycle,
      timer: room.timer,
      participants: [...room.participants.values()],
    };
  }
}
