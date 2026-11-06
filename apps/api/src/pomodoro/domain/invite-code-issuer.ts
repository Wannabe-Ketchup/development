import { ServiceUnavailableException } from '@nestjs/common';
import { InviteCode } from './invite-code';

export const MAX_INVITE_CODE_ISSUE_ATTEMPTS = 5;

export class InviteCodeIssuer {
  private constructor() {}

  // 겹치지 않는 코드가 나올 때까지 최대 5번 만든다. 5번 모두 겹치면 503
  static issue(
    pickIndex: (bound: number) => number,
    isTaken: (inviteCode: InviteCode) => boolean,
  ): InviteCode {
    for (let attempt = 0; attempt < MAX_INVITE_CODE_ISSUE_ATTEMPTS; attempt++) {
      const inviteCode = InviteCode.generate(pickIndex);
      if (!isTaken(inviteCode)) {
        return inviteCode;
      }
    }

    throw new ServiceUnavailableException(
      '초대코드를 만들지 못했습니다. 잠시 후 다시 시도해 주세요.',
    );
  }
}
