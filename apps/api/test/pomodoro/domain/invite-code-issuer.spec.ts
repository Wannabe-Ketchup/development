import { ServiceUnavailableException } from '@nestjs/common';
import { InviteCode } from '../../../src/pomodoro/domain/invite-code';
import { InviteCodeIssuer } from '../../../src/pomodoro/domain/invite-code-issuer';

describe('InviteCodeIssuer', () => {
  describe('issue', () => {
    it('앞의 4번이 이미 쓰이는 코드여도 5번째 코드가 겹치지 않으면 그 코드를 발급한다', () => {
      // given
      // 시도마다 6번씩 고르므로 시도 n번째는 n번째 위치(0, 1, 2, 3, 4)의 문자 6개가 된다
      let picked = 0;
      const pickIndex = () => Math.floor(picked++ / 6);
      const takenCodes = ['AAAAAA', 'BBBBBB', 'CCCCCC', 'DDDDDD'];
      const isTaken = (code: InviteCode) => takenCodes.includes(code.value);

      // when
      const inviteCode = InviteCodeIssuer.issue(pickIndex, isTaken);

      // then
      expect(inviteCode.value).toBe('EEEEEE');
    });

    it('5번 모두 이미 쓰이는 코드면 초대코드를 발급할 수 없다', () => {
      // given
      const pickIndex = () => 0;
      const isTaken = () => true;

      // when & then
      expect(() => InviteCodeIssuer.issue(pickIndex, isTaken)).toThrow(
        ServiceUnavailableException,
      );
    });
  });
});
