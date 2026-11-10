import { Injectable, NotFoundException } from '@nestjs/common';
import type { JoinRoomResponse } from '@pomodoro/shared';
import { InviteCodeRepository } from '../repository/invite-code.repository';
import { InviteCode } from '../domain/invite-code';
import { EnterRoomService } from './enter-room.service';

@Injectable()
export class EnterRoomByInviteCodeService {
  constructor(
    private readonly inviteCodeRepository: InviteCodeRepository,
    private readonly enterRoomService: EnterRoomService,
  ) {}

  // 메인 화면에서 입력한 초대코드의 방에 입장한다. 형식이 틀리거나 없는 코드면 없는 방으로 본다
  enterRoomByInviteCode(
    inviteCode: string,
    participantId: string,
  ): JoinRoomResponse {
    const roomId = this.inviteCodeRepository.findRoomIdByInviteCode(
      InviteCode.normalize(inviteCode),
    );
    if (!roomId) {
      throw new NotFoundException('존재하지 않는 방입니다.');
    }

    return this.enterRoomService.joinRoom(roomId, participantId);
  }
}
