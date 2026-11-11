// 콘텐츠가 잘리지 않는 최소 뷰포트. 세션 라벨이 60%-480px에 있어 높이 800 + 여유 20.
export const BASE_WIDTH_PX = 1440;
export const BASE_HEIGHT_PX = 820;
// 이보다 작으면 글자·버튼이 너무 작아 안내 화면을 보여 준다. 구형 iPad 가로(약 0.71)는 통과, 폰 가로(0.45 이하)는 안내.
export const MIN_SCALE = 0.65;

export type ViewportMode =
  | { mode: 'full' }
  | { mode: 'scaled'; scale: number }
  | { mode: 'unsupported'; reason: 'portrait' | 'too-small' };

export function getViewportMode(size: {
  width: number;
  height: number;
}): ViewportMode {
  if (size.width < size.height) {
    return { mode: 'unsupported', reason: 'portrait' };
  }

  const scale = Math.min(
    size.width / BASE_WIDTH_PX,
    size.height / BASE_HEIGHT_PX,
    1,
  );
  if (scale < MIN_SCALE) return { mode: 'unsupported', reason: 'too-small' };
  if (scale === 1) return { mode: 'full' };
  return { mode: 'scaled', scale };
}
