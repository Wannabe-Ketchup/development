export const NICKNAME_MIN_LENGTH = 1;
// 도메인 규칙은 영문·숫자·공백 1, 한글 1.5, 합 11 이하다.
// 소수를 피하려고 모두 2배로 센다(영문·숫자·공백 2, 한글 3, 한도 22). 한글만 7자, 영문만 11자
export const NICKNAME_MAX_WEIGHT = 22;
// 공백은 스페이스(U+0020)만 허용한다. 탭·줄바꿈 등까지 받는 \s는 쓰지 않는다
export const NICKNAME_ALLOWED_PATTERN = /^[ 가-힣ㄱ-ㅎㅏ-ㅣa-zA-Z0-9]+$/;
