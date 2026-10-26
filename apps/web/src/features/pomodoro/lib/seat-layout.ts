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
