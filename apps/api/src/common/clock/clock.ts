// 현재 시각 포트. 테스트에서는 고정 시각 구현으로 교체한다.
export abstract class Clock {
  abstract now(): Date;
}
