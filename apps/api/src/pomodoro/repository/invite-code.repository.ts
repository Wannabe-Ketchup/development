import { InviteCode } from '../domain/invite-code';

export abstract class InviteCodeRepository {
  abstract save(roomId: string, inviteCode: InviteCode): void;

  abstract exists(inviteCode: InviteCode): boolean;

  abstract findByRoomId(roomId: string): InviteCode | undefined;
}
