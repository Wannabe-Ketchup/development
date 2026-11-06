import type { InviteCodeResponse as InviteCodeResponseShape } from '@pomodoro/shared';
import type { InviteCode } from '../domain/invite-code';

export class InviteCodeResponse implements InviteCodeResponseShape {
  private constructor(public readonly inviteCode: string) {}

  static from(inviteCode: InviteCode): InviteCodeResponse {
    return new InviteCodeResponse(inviteCode.value);
  }
}
