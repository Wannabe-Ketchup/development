// 장면(의자·참여자·책상 소품) 크기는 모든 화면에서 같다. 시안의 약 0.9배로 정한 실제 크기다
// 좌석 가운데끼리의 간격
export const SEAT_SPACING_PX = 198;
// Participant의 의자 너비(w-32.5)와 같은 값. 참가자 목록의 실제 너비를 계산하는 데 쓴다.
export const SEAT_WIDTH_PX = 130;
// 참가자 목록 박스의 높이. 앵커(의자 바닥)에서 닉네임·토마토 묶음 윗면 근처까지 덮는다.
// 가변 높이인 상태 메시지 말풍선은 포함하지 않는다.
export const SEATS_HEIGHT_PX = 293;

// 좌석이 바뀔 때 참여자와 책상 위 소품이 같은 속도로 함께 미끄러지도록 한곳에서 관리한다.
// 움직임 줄이기를 켜면 바로 옮긴다. 시간은 이동 거리에 따라 style로 준다(useSeatMoveDuration)
export const SEAT_MOVE_TRANSITION_CLASS =
  'transition-transform ease-out motion-reduce:transition-none';

// 같은 속도로 보이게 이동 거리에 비례한 시간을 쓴다. 폰에서 한 명 넘길 때(화면 너비 약 393) 약 330ms다.
// 짧은 이동이 너무 빨리 튀거나, 여러 명을 건너뛸 때 너무 오래 걸리지 않게 위아래를 막는다
const SEAT_MOVE_SPEED_PX_PER_MS = 1.2;
export const SEAT_MOVE_MIN_DURATION_MS = 150;
export const SEAT_MOVE_MAX_DURATION_MS = 600;

export function getSeatMoveDurationMs(distancePx: number): number {
  return Math.round(
    Math.min(
      SEAT_MOVE_MAX_DURATION_MS,
      Math.max(
        SEAT_MOVE_MIN_DURATION_MS,
        Math.abs(distancePx) / SEAT_MOVE_SPEED_PX_PER_MS,
      ),
    ),
  );
}

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

// 폰: 보고 있는 참여자를 가운데(0)에 두고, 나머지는 간격(화면 너비)만큼 양옆에 둔다.
// 보는 사람이 바뀌면 좌석 이동 transition으로 미끄러진다
export function getCarouselTranslateX(
  index: number,
  viewedIndex: number,
  spacingPx: number,
): number {
  return (index - viewedIndex) * spacingPx;
}
