export function getSeatTranslateX(
  index: number,
  total: number,
  seatSpacingPx: number,
): number {
  return (index - (total - 1) / 2) * seatSpacingPx;
}
