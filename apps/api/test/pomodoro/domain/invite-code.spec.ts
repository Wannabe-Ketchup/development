import { BadRequestException } from '@nestjs/common';
import { InviteCode } from '../../../src/pomodoro/domain/invite-code';

describe('InviteCode', () => {
  describe('generate', () => {
    it.each([
      { index: 0, expected: 'AAAAAA' },
      { index: 30, expected: '999999' },
    ])(
      '고른 문자 위치가 $index이면 초대코드는 $expected 6자가 된다',
      ({ index, expected }) => {
        // when
        const inviteCode = InviteCode.generate(() => index);

        // then
        expect(inviteCode.value).toBe(expected);
      },
    );
  });

  describe('of', () => {
    it.each([{ length: 5 }, { length: 7 }])(
      '길이가 $length자인 값은 초대코드가 될 수 없다',
      ({ length }) => {
        // given
        const value = 'A'.repeat(length);

        // when & then
        expect(() => InviteCode.of(value)).toThrow(BadRequestException);
      },
    );

    it.each([
      { value: 'AAAAA0' },
      { value: 'AAAAAO' },
      { value: 'AAAAA1' },
      { value: 'AAAAAI' },
      { value: 'AAAAAL' },
      { value: 'AAAAAa' },
    ])(
      '헷갈리는 문자나 소문자($value)가 들어간 값은 초대코드가 될 수 없다',
      ({ value }) => {
        // when & then
        expect(() => InviteCode.of(value)).toThrow(BadRequestException);
      },
    );
  });
});
