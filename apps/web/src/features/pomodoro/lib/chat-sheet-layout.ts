// 시트 윗면은 처음 연 화면 높이의 이 비율 아래에 둔다
const SHEET_TOP_RATIO = 0.25;
// 제목 줄, 메시지 한두 줄, 입력창이 들어가는 높이. 키보드로 보이는 영역이 이보다 작아지면 그때만 시트 윗면이 올라간다
export const MIN_SHEET_HEIGHT_PX = 160;

// 연 순간보다 보이는 높이가 이만큼 넘게 줄면 화면 키보드가 올라온 것으로 본다.
// iOS 26은 키보드가 올라오면 innerHeight·clientHeight도 함께 줄어, 레이아웃 높이와 비교할 수 없다
const KEYBOARD_MIN_HEIGHT_PX = 120;

export function isKeyboardOpen(
  visibleHeight: number,
  openedVisibleHeight: number,
): boolean {
  return KEYBOARD_MIN_HEIGHT_PX < openedVisibleHeight - visibleHeight;
}

export function getSheetTopPx(openedViewportHeight: number): number {
  return Math.round(openedViewportHeight * SHEET_TOP_RATIO);
}

// 보이는 영역 안에서 시트가 차지하는 높이. 키보드가 올라와도 윗면은 그대로 두고 높이만 줄인다
export function getSheetHeightPx(
  visibleHeight: number,
  sheetTopPx: number,
): number {
  return Math.min(
    visibleHeight,
    Math.max(MIN_SHEET_HEIGHT_PX, visibleHeight - sheetTopPx),
  );
}
