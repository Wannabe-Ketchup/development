// 1.5배를 정수로 다루려고 영문 1 : 한글 1.5를 2 : 3으로 센다
const HANGUL_PATTERN = /[가-힣ㄱ-ㅎㅏ-ㅣ]/;
const HANGUL_WEIGHT = 3;
const BASIC_WEIGHT = 2;

// 닉네임 허용 문자는 모두 한 코드 포인트라 한 글자씩 더한다
export function getNicknameWeight(nickname: string): number {
  let weight = 0;
  for (const character of nickname) {
    weight += HANGUL_PATTERN.test(character) ? HANGUL_WEIGHT : BASIC_WEIGHT;
  }
  return weight;
}
