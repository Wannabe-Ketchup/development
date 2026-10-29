// 좌석이 바뀔 때 참여자와 책상 위 소품이 같은 속도로 함께 미끄러지도록 한곳에서 관리한다.
export const SEAT_MOVE_TRANSITION_CLASS =
  'transition-transform duration-300 ease-out';

export function getSeatsWidthPx(
  total: number,
  seatSpacingPx: number,
  seatWidthPx: number,
): number {
  if (total <= 0) return 0;
  return (total - 1) * seatSpacingPx + seatWidthPx;
}

export function getSeatTranslateX(
  index: number,
  total: number,
  seatSpacingPx: number,
): number {
  return (index - (total - 1) / 2) * seatSpacingPx;
}
