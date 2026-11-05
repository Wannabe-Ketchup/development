import { InviteCode } from '../domain/invite-code';

export abstract class InviteCodeRepository {
  abstract save(roomId: string, inviteCode: InviteCode): void;

  abstract exists(inviteCode: InviteCode): boolean;

  abstract findByRoomId(roomId: string): InviteCode | undefined;

  // value는 정규화된 입력. 발급된 코드가 아니면(형식이 틀린 값 포함) undefined
  abstract findRoomIdByInviteCode(value: string): string | undefined;
}
