import { generateRandomNickname } from './nickname.util';

describe('generateRandomNickname', () => {
  const allowedAdjectives = ['졸린', '배고픈', '느긋한', '즐거운'];
  const nicknamePattern = new RegExp(
    `^(${allowedAdjectives.join('|')})토마토$`,
  );

  it("정해진 형용사 목록 중 하나와 '토마토'가 결합된 닉네임을 생성한다", () => {
    // When
    const nickname = generateRandomNickname();

    // Then
    expect(nickname).toMatch(nicknamePattern);
  });

  it('호출할 때마다 허용된 닉네임 집합을 벗어나지 않는다', () => {
    // Given
    const callCount = 20;

    // When
    const nicknames = Array.from({ length: callCount }, () =>
      generateRandomNickname(),
    );

    // Then
    nicknames.forEach((nickname) => {
      expect(nickname).toMatch(nicknamePattern);
    });
  });
});
