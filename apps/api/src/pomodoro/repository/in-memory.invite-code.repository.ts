import { Injectable } from '@nestjs/common';
import { InviteCode } from '../domain/invite-code';
import { InviteCodeRepository } from './invite-code.repository';

@Injectable()
export class InMemoryInviteCodeRepository extends InviteCodeRepository {
  // 발급된 코드 → roomId. 키 집합이 유일성 판정(exists)을 맡는다
  private readonly roomIdByCode = new Map<string, string>();
  // 방별 코드. 참여자 조회(findByRoomId)에 쓴다
  private readonly codeByRoomId = new Map<string, InviteCode>();

  save(roomId: string, inviteCode: InviteCode): void {
    this.roomIdByCode.set(inviteCode.value, roomId);
    this.codeByRoomId.set(roomId, inviteCode);
  }

  exists(inviteCode: InviteCode): boolean {
    return this.roomIdByCode.has(inviteCode.value);
  }

  findByRoomId(roomId: string): InviteCode | undefined {
    return this.codeByRoomId.get(roomId);
  }

  findRoomIdByInviteCode(value: string): string | undefined {
    return this.roomIdByCode.get(value);
  }

  deleteByRoomId(roomId: string): void {
    const inviteCode = this.codeByRoomId.get(roomId);
    if (!inviteCode) {
      return;
    }

    this.roomIdByCode.delete(inviteCode.value);
    this.codeByRoomId.delete(roomId);
  }
}
