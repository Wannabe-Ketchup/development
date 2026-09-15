import { describe, it, expect } from 'vitest';
import { getSeatTranslateX } from './seat-layout';

const SEAT_SPACING_PX = 100;

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
