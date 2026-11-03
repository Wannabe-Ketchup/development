const BLANK_NICKNAME_LABEL = '이름 없음';

// 공백만 있는 닉네임은 화면 낭독기가 읽을 이름이 없어 대신 읽을 문구를 준다
export function getNicknameLabel(nickname: string): string {
  return nickname.trim() === '' ? BLANK_NICKNAME_LABEL : nickname;
}
