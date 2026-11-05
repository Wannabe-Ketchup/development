import { BadRequestException } from '@nestjs/common';

export const INVITE_CODE_LENGTH = 6;
// 대문자와 숫자에서 헷갈리는 0 O 1 I L을 뺀 31자
export const INVITE_CODE_CHARACTERS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

export class InviteCode {
  private constructor(public readonly value: string) {}

  // 불변식: 6자, 허용 문자만
  static of(value: string): InviteCode {
    const isValid =
      value.length === INVITE_CODE_LENGTH &&
      [...value].every((character) =>
        INVITE_CODE_CHARACTERS.includes(character),
      );
    if (!isValid) {
      throw new BadRequestException('초대코드 형식이 올바르지 않습니다.');
    }

    return new InviteCode(value);
  }

  // pickIndex(bound)는 0 이상 bound 미만의 정수를 돌려준다
  static generate(pickIndex: (bound: number) => number): InviteCode {
    const value = Array.from(
      { length: INVITE_CODE_LENGTH },
      () => INVITE_CODE_CHARACTERS[pickIndex(INVITE_CODE_CHARACTERS.length)],
    ).join('');

    return InviteCode.of(value);
  }

  // 검증하지 않는다. repository와 테스트 given에서만 호출한다
  static restore(value: string): InviteCode {
    return new InviteCode(value);
  }
}
