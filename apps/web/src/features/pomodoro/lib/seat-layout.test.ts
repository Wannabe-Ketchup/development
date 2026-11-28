import { describe, it, expect } from 'vitest';
import {
  getCarouselTranslateX,
  getSeatMoveDurationMs,
  SEAT_MOVE_MAX_DURATION_MS,
  SEAT_MOVE_MIN_DURATION_MS,
  getSeatsWidthPx,
  getSeatTranslateX,
} from './seat-layout';

const SEAT_SPACING_PX = 100;
const SEAT_WIDTH_PX = 40;

describe('getSeatsWidthPx', () => {
  it('참가자가 1명이면 좌석 너비 하나와 같다', () => {
    expect(getSeatsWidthPx(1, SEAT_SPACING_PX, SEAT_WIDTH_PX)).toBe(
      SEAT_WIDTH_PX,
    );
  });

  it('참가자가 늘 때마다 좌석 간격만큼 너비가 늘어난다', () => {
    // given / when
    const two = getSeatsWidthPx(2, SEAT_SPACING_PX, SEAT_WIDTH_PX);
    const four = getSeatsWidthPx(4, SEAT_SPACING_PX, SEAT_WIDTH_PX);

    // then
    expect(two).toBe(SEAT_SPACING_PX + SEAT_WIDTH_PX);
    expect(four).toBe(3 * SEAT_SPACING_PX + SEAT_WIDTH_PX);
  });

  it('참가자가 없으면 0이다', () => {
    expect(getSeatsWidthPx(0, SEAT_SPACING_PX, SEAT_WIDTH_PX)).toBe(0);
  });
});

describe('getSeatTranslateX', () => {
  it('참가자가 1명이면 정중앙(0)에 위치한다', () => {
    expect(getSeatTranslateX(0, 1, SEAT_SPACING_PX)).toBe(0);
  });

  it('두 번째 참가자가 입장하면 첫 번째 참가자는 왼쪽으로, 두 번째 참가자는 그 오른쪽으로 이동하며 둘이 가운데 정렬을 유지한다', () => {
    // given / when
    const first = getSeatTranslateX(0, 2, SEAT_SPACING_PX);
    const second = getSeatTranslateX(1, 2, SEAT_SPACING_PX);

    // then
    expect(first).toBeLessThan(0);
    expect(second).toBeGreaterThan(0);
    expect(first).toBe(-second);
  });

  it('세 번째 참가자가 입장하면 첫 번째·두 번째 참가자는 각각 왼쪽으로 한 칸씩 옮겨가고, 세 번째 참가자가 가장 오른쪽에 추가되며 셋이 가운데 정렬을 유지한다', () => {
    // given / when
    const first = getSeatTranslateX(0, 3, SEAT_SPACING_PX);
    const second = getSeatTranslateX(1, 3, SEAT_SPACING_PX);
    const third = getSeatTranslateX(2, 3, SEAT_SPACING_PX);

    // then
    expect(second).toBe(0);
    expect(first).toBeLessThan(second);
    expect(second).toBeLessThan(third);
    expect(first).toBe(-third);
  });

  it('좌석 간격(seatSpacingPx)이 주어진 값에 정확히 비례한다', () => {
    // given / when
    const narrow = getSeatTranslateX(1, 2, 50);
    const wide = getSeatTranslateX(1, 2, 100);

    // then
    expect(wide).toBe(narrow * 2);
  });
});

describe('getCarouselTranslateX', () => {
  it('보고 있는 참여자는 가운데, 앞뒤 참여자는 간격만큼 양옆에 있다', () => {
    // given
    const viewedIndex = 1;
    const spacing = 393;

    // when
    const positions = [0, 1, 2].map((index) =>
      getCarouselTranslateX(index, viewedIndex, spacing),
    );

    // then
    expect(positions).toEqual([-393, 0, 393]);
  });
});

describe('getSeatMoveDurationMs', () => {
  it('이동 거리가 길수록 시간이 길다', () => {
    // when
    const oneStep = getSeatMoveDurationMs(393);
    const longer = getSeatMoveDurationMs(600);

    // then
    expect(oneStep).toBe(328);
    expect(longer).toBeGreaterThan(oneStep);
  });

  it('왼쪽으로 움직여도 거리만 본다', () => {
    expect(getSeatMoveDurationMs(-393)).toBe(getSeatMoveDurationMs(393));
  });

  it('짧은 이동은 최소 시간, 아주 긴 이동은 최대 시간으로 막는다', () => {
    expect(getSeatMoveDurationMs(10)).toBe(SEAT_MOVE_MIN_DURATION_MS);
    expect(getSeatMoveDurationMs(5000)).toBe(SEAT_MOVE_MAX_DURATION_MS);
  });
});
