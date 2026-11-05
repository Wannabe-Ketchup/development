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

  describe('normalize', () => {
    it.each([
      { input: 'K7P2QX', expected: 'K7P2QX' },
      { input: 'k7p2qx', expected: 'K7P2QX' },
      { input: ' K7P2QX ', expected: 'K7P2QX' },
      { input: ' k7p2qx ', expected: 'K7P2QX' },
    ])(
      '소문자나 앞뒤 공백이 있는 입력($input)도 같은 초대코드($expected)로 본다',
      ({ input, expected }) => {
        // when
        const normalized = InviteCode.normalize(input);

        // then
        expect(normalized).toBe(expected);
      },
    );
  });

  describe('isInviteCodeInput', () => {
    it.each([
      { input: 'K7P2QX' },
      { input: 'k7p2qx' },
      { input: ' K7P2QX ' },
      { input: 'ABC0O1' },
    ])('정리한 길이가 6자인 입력($input)은 초대코드로 본다', ({ input }) => {
      // when
      const isInviteCode = InviteCode.isInviteCodeInput(input);

      // then
      expect(isInviteCode).toBe(true);
    });

    it.each([
      { input: 'K7P2Q' },
      { input: 'K7P2QXZ' },
      { input: '3f2b8c1e-5d4a-4e7b-9c6d-1a2b3c4d5e6f' },
    ])(
      '정리한 길이가 6자가 아닌 입력($input)은 초대코드로 보지 않는다',
      ({ input }) => {
        // when
        const isInviteCode = InviteCode.isInviteCodeInput(input);

        // then
        expect(isInviteCode).toBe(false);
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
