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

  // 사용자 입력을 코드 비교용으로 바꾼다: 앞뒤 공백 제거 + 대문자
  static normalize(input: string): string {
    return input.trim().toUpperCase();
  }

  // 입장 값이 초대코드로 들어온 것인지 판별한다. 정규화한 길이가 6이면 초대코드다.
  // 문자 집합은 보지 않는다(6자인데 틀린 문자는 roomId가 아니라 틀린 코드다)
  static isInviteCodeInput(input: string): boolean {
    return InviteCode.normalize(input).length === INVITE_CODE_LENGTH;
  }

  // 검증하지 않는다. repository와 테스트 given에서만 호출한다
  static restore(value: string): InviteCode {
    return new InviteCode(value);
  }
}
