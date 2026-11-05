// 난수 포트. 테스트에서는 고정값 구현으로 교체한다.
export abstract class Random {
  // 0 이상 bound 미만의 정수
  abstract nextInt(bound: number): number;
}
