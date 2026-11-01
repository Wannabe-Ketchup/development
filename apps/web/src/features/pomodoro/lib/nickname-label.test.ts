import { describe, expect, it } from 'vitest';
import { getNicknameLabel } from './nickname-label';

describe('getNicknameLabel', () => {
  it.each([
    { case: '공백 하나', nickname: ' ' },
    { case: '공백 셋', nickname: '   ' },
  ])(
    "'$case'처럼 공백만 있는 닉네임은 '이름 없음'으로 읽는다",
    ({ nickname }) => {
      // when
      const label = getNicknameLabel(nickname);

      // then
      expect(label).toBe('이름 없음');
    },
  );

  it('공백이 아닌 글자가 있으면 닉네임을 그대로 읽는다', () => {
    // given
    const nickname = ' 토마토 ';

    // when
    const label = getNicknameLabel(nickname);

    // then
    expect(label).toBe(' 토마토 ');
  });
});
