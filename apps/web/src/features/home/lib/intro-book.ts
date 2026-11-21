export const SPREAD_COUNT = 5;
export const FIRST_SPREAD = 1; // 표지 없이 차례와 첫 장이 펼쳐진 채로 시작한다
export const SHEET_COUNT = SPREAD_COUNT + 1;
export const FLIP_DURATION_MS = 650;
export const JUMP_STAGGER_MS = 90; // 책갈피로 여러 장 건너뛸 때 장 사이 간격
export const BOOK_SIZE_PX = { width: 940, height: 580 } as const;

export const BOOKMARKS = [
  { label: '처음', spread: 1, colorClassName: 'bg-cream' },
  { label: '뽀모도로', spread: 2, colorClassName: 'bg-tomato-body-1' },
  { label: '함께', spread: 3, colorClassName: 'bg-tomato-body-2' },
  { label: '사용법', spread: 4, colorClassName: 'bg-tomato-body-3' },
  { label: 'FAQ', spread: 5, colorClassName: 'bg-tomato-body-4' },
] as const;

export type FlipDirection = 'prev' | 'next';

// prev는 1에서, next는 SPREAD_COUNT에서 멈춘다
export function getNextSpread(
  spread: number,
  direction: FlipDirection,
): number {
  if (direction === 'next') return Math.min(spread + 1, SPREAD_COUNT);
  return Math.max(spread - 1, 1);
}

// 현재 펼침이 속한 책갈피의 spread
export function getBookmarkOwner(spread: number): number | null {
  const owner = BOOKMARKS.findLast((bookmark) => bookmark.spread <= spread);
  return owner?.spread ?? null;
}

// 종이 k는 k < spread면 왼쪽으로 넘어가 있다. 종이 0(뒷면이 차례)은 펼침이 1 이상이라 늘 왼쪽에 있다.
// 쌓임 순서: 넘어간 종이는 번호가 클수록 위, 남은 종이는 번호가 작을수록 위
export function getSheetLayout(
  sheetIndex: number,
  spread: number,
): { isFlipped: boolean; zIndex: number } {
  const isFlipped = sheetIndex < spread;
  // 넘어간 종이(왼쪽)와 남은 종이(오른쪽)는 서로 다른 쪽에 있어 z-index가 겹쳐도 되지만,
  // 넘기는 도중 두 쪽을 가로지르므로 값이 겹치지 않게 넘어간 쪽을 더 높게 둔다
  const zIndex = isFlipped
    ? SHEET_COUNT + sheetIndex
    : SHEET_COUNT - sheetIndex;
  return { isFlipped, zIndex };
}

// 책 가운데를 기준으로 오른쪽 절반은 next, 왼쪽 절반은 prev
export function getClickDirection(
  clientX: number,
  rect: { left: number; width: number },
): FlipDirection {
  return clientX > rect.left + rect.width / 2 ? 'next' : 'prev';
}
