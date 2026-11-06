import { InviteCode } from '../domain/invite-code';

export abstract class InviteCodeRepository {
  abstract save(roomId: string, inviteCode: InviteCode): void;

  abstract exists(inviteCode: InviteCode): boolean;

  abstract findByRoomId(roomId: string): InviteCode | undefined;

  // value는 정규화된 입력. 발급된 코드가 아니면(형식이 틀린 값 포함) undefined
  abstract findRoomIdByInviteCode(value: string): string | undefined;

  // 해제한 코드는 다른 방이 받을 수 있다. 코드가 없는 방이면 아무 일도 하지 않는다
  abstract deleteByRoomId(roomId: string): void;
}
