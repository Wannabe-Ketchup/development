import { Injectable } from '@nestjs/common';
import { InviteCode } from '../domain/invite-code';
import { InviteCodeRepository } from './invite-code.repository';

@Injectable()
export class InMemoryInviteCodeRepository extends InviteCodeRepository {
  // 발급된 코드 집합. 유일성 판정(exists)에 쓴다
  private readonly issuedCodes = new Set<string>();
  // 방별 코드. 참여자 조회(findByRoomId)에 쓴다
  private readonly codeByRoomId = new Map<string, InviteCode>();

  save(roomId: string, inviteCode: InviteCode): void {
    this.issuedCodes.add(inviteCode.value);
    this.codeByRoomId.set(roomId, inviteCode);
  }

  exists(inviteCode: InviteCode): boolean {
    return this.issuedCodes.has(inviteCode.value);
  }

  findByRoomId(roomId: string): InviteCode | undefined {
    return this.codeByRoomId.get(roomId);
  }
}
