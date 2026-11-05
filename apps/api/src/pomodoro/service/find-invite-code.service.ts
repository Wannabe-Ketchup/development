import { Injectable, NotFoundException } from '@nestjs/common';
import { InviteCode } from '../domain/invite-code';
import { InviteCodeRepository } from '../repository/invite-code.repository';
import { RoomQueryService } from './room-query.service';

@Injectable()
export class FindInviteCodeService {
  constructor(
    private readonly roomQueryService: RoomQueryService,
    private readonly inviteCodeRepository: InviteCodeRepository,
  ) {}

  findInviteCode(roomId: string, participantId: string): InviteCode {
    const room = this.roomQueryService.findExistingRoom(roomId);
    room.validateParticipant(participantId);

    const inviteCode = this.inviteCodeRepository.findByRoomId(roomId);
    if (!inviteCode) {
      throw new NotFoundException('초대코드가 없는 방입니다.');
    }

    return inviteCode;
  }
}
