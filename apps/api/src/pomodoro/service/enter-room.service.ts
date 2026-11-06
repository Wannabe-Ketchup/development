import { Injectable, NotFoundException } from '@nestjs/common';
import { RoomRepository } from '../repository/room.repository';
import { InviteCodeRepository } from '../repository/invite-code.repository';
import { RoomQueryService } from './room-query.service';
import { RoomPresenceTracker } from './room-presence.tracker';
import { JoinRoomResponse } from '../dto/join-room-response.dto';
import { RoomDto } from '../dto/room.dto';
import { Participant } from '../domain/participant.entity';
import { InviteCode } from '../domain/invite-code';

const NICKNAME_ADJECTIVES = ['졸린', '배고픈', '느긋한', '즐거운', '멋진'];

@Injectable()
export class EnterRoomService {
  constructor(
    private readonly roomQueryService: RoomQueryService,
    private readonly roomRepository: RoomRepository,
    private readonly roomPresenceTracker: RoomPresenceTracker,
    private readonly inviteCodeRepository: InviteCodeRepository,
  ) {}

  // roomIdOrInviteCode: 링크로 오면 roomId, 메인 화면에서 오면 초대코드
  // participantId는 로그인 세션의 값이다. 같은 세션이 다시 입장하면 기존 참가자를 돌려준다.
  joinRoom(
    roomIdOrInviteCode: string,
    participantId: string,
  ): JoinRoomResponse {
    const roomId = this.resolveRoomId(roomIdOrInviteCode);
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

  // 초대코드면 그 코드의 roomId로 바꾸고, 아니면 입력값을 그대로 roomId로 쓴다
  private resolveRoomId(roomIdOrInviteCode: string): string {
    if (!InviteCode.isInviteCodeInput(roomIdOrInviteCode)) {
      return roomIdOrInviteCode;
    }

    const roomId = this.inviteCodeRepository.findRoomIdByInviteCode(
      InviteCode.normalize(roomIdOrInviteCode),
    );
    if (!roomId) {
      throw new NotFoundException('존재하지 않는 방입니다.');
    }
    return roomId;
  }

  private generateRandomNickname(): string {
    const adjective =
      NICKNAME_ADJECTIVES[
        Math.floor(Math.random() * NICKNAME_ADJECTIVES.length)
      ];

    return `${adjective}토마토`;
  }
}
