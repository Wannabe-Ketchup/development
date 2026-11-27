// 콘텐츠가 잘리지 않는 최소 뷰포트. 세션 라벨이 60%-480px에 있어 높이 800 + 여유 20.
export const BASE_WIDTH_PX = 1440;
export const BASE_HEIGHT_PX = 820;
// 이보다 작으면 글자·버튼이 너무 작아 안내 화면을 보여 준다. 구형 iPad 가로(약 0.71)는 통과, 폰 가로(0.45 이하)는 안내.
export const MIN_SCALE = 0.65;
// 방에서 이보다 좁으면 폰 시안. 중간 시안에 4명이 한 줄로 앉아 양 끝 상태 메시지(한글 10자, 너비 약 226)까지 보이는 폭이다.
// 양 끝 좌석 가운데 297 + 말풍선 절반 113 = 410, 양쪽 × 2 + 좌우 여백 24 × 2 ≈ 868
export const MOBILE_MAX_WIDTH_PX = 870;
// 방에서 이보다 좁으면 중간 시안을 쓴다. 데스크톱 선반 끝은 중앙에서 587이라 1174보다 좁으면 선반·조명 끝이 잘린다
export const ROOM_TABLET_MAX_WIDTH_PX = 1080;

export type CompactLayout = 'mobile' | 'tablet';

// 방 화면. 높이는 보지 않는다. 키보드가 올라와 높이가 줄어도 화면이 바뀌면 안 된다
export type RoomViewportMode =
  { mode: 'compact'; layout: CompactLayout } | { mode: 'desktop' };

export function getRoomViewportMode(size: {
  width: number;
  height: number;
}): RoomViewportMode {
  if (size.width < MOBILE_MAX_WIDTH_PX) {
    return { mode: 'compact', layout: 'mobile' };
  }
  if (size.width < ROOM_TABLET_MAX_WIDTH_PX) {
    return { mode: 'compact', layout: 'tablet' };
  }
  return { mode: 'desktop' };
}

// 홈·404. 좁은 화면 시안이 없어 너비가 줄면 안내한다
export type PageViewportMode =
  | { mode: 'full' }
  | { mode: 'scaled'; scale: number }
  | { mode: 'unsupported' };

export function getPageViewportMode(size: {
  width: number;
  height: number;
}): PageViewportMode {
  const scale = Math.min(
    size.width / BASE_WIDTH_PX,
    size.height / BASE_HEIGHT_PX,
    1,
  );
  if (scale < MIN_SCALE) return { mode: 'unsupported' };
  if (scale === 1) return { mode: 'full' };
  return { mode: 'scaled', scale };
}
