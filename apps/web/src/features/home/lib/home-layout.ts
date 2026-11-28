import { MOBILE_MAX_WIDTH_PX } from '@/lib/viewport-mode';

// 이보다 넓으면 데스크톱 홈을 원래 크기로 그린다. 한 줄 1102 + 드래그 점선 48×2
export const HOME_DESKTOP_MIN_WIDTH_PX = 1200;

export type HomeLayout = 'desktop' | 'medium' | 'portrait' | 'landscape';

// 데스크톱·중간은 너비만 본다. 높이는 너비 870 미만에서 가로/세로를 가를 때만 쓴다
export function getHomeLayout(size: {
  width: number;
  height: number;
}): HomeLayout {
  if (HOME_DESKTOP_MIN_WIDTH_PX <= size.width) return 'desktop';
  if (MOBILE_MAX_WIDTH_PX <= size.width) return 'medium';
  const isWiderThanTall = size.width > size.height;
  return isWiderThanTall ? 'landscape' : 'portrait';
}

interface HomeLayoutMetrics {
  // 그림(소파·테이블·토마토·화살표) 배율. 세로 배치의 아래 화살표만 예외로 고정 크기다(GuideSection)
  illustrationScale: number;
  gapPx: number;
  guideGapPx: number;
  // 드래그 중 점선이 테이블 밖으로 나오는 길이. 드롭 인정 범위는 이보다 DROP_SLACK_PX 넓다
  dropInsetPx: number;
  // 말풍선과 토마토 사이
  popoverGapPx: number;
}

// 점선 밖으로 이만큼까지 놓아도 책상에 놓은 것으로 본다 (데스크톱 점선 48 + 12 = 기존 60)
export const DROP_SLACK_PX = 12;

// 레이아웃마다 함께 바뀌는 값. 승인 시안(home-mock) 기준이고 portrait 간격만 개발자 요청으로 넓혔다
export const HOME_LAYOUT_METRICS: Record<HomeLayout, HomeLayoutMetrics> = {
  desktop: {
    illustrationScale: 1,
    gapPx: 80,
    guideGapPx: 24,
    dropInsetPx: 48,
    popoverGapPx: 12,
  },
  medium: {
    illustrationScale: 0.75,
    gapPx: 40,
    guideGapPx: 16,
    dropInsetPx: 36,
    popoverGapPx: 12,
  },
  portrait: {
    illustrationScale: 0.8,
    gapPx: 32,
    guideGapPx: 12,
    dropInsetPx: 24,
    popoverGapPx: 20,
  },
  landscape: {
    illustrationScale: 0.55,
    gapPx: 24,
    guideGapPx: 8,
    dropInsetPx: 16,
    popoverGapPx: 16,
  },
};

// 보이는 영역 안쪽 여백. 말풍선을 영역 가장자리에 붙이지 않는다
export const SCENE_EDGE_PX = 12;

interface VerticalRange {
  top: number;
  bottom: number;
}

// 장면을 세로로 얼마나 옮길지(px, 양수면 아래로). 측정값은 오프셋을 걸기 전 위치다.
// - 말풍선이 보이는 영역을 벗어나면(키보드 등): 말풍선 윗면을 보이는 영역 맨 위에 맞춘다. 영역보다 크면 아래가 잘린다
// - 그 밖에 가로 휴대폰에서 말풍선이 열려 있으면: 말풍선과 한 줄을 합친 묶음을 영역 가운데에 둔다
export function getSceneOffsetPx({
  popover,
  group,
  visible,
  shouldCenterGroup,
}: {
  popover: VerticalRange;
  group: VerticalRange;
  visible: VerticalRange;
  shouldCenterGroup: boolean;
}): number {
  const centerOffset = shouldCenterGroup
    ? (visible.top + visible.bottom) / 2 - (group.top + group.bottom) / 2
    : 0;
  const top = popover.top + centerOffset;
  const bottom = popover.bottom + centerOffset;
  const isPopoverHidden =
    top < visible.top + SCENE_EDGE_PX ||
    visible.bottom - SCENE_EDGE_PX < bottom;
  if (!isPopoverHidden) return centerOffset;
  return visible.top + SCENE_EDGE_PX - popover.top;
}

// 시안 px 크기를 그림 배율(--home-k, 홈 루트가 준다)에 맞춘 CSS 값으로 바꾼다
export function toScaledPx(px: number): string {
  return `calc(${px}px * var(--home-k))`;
}
