import { describe, it, expect } from 'vitest';
import {
  buildBubblePath,
  BUBBLE_BORDER_RADIUS_PX,
  BUBBLE_TAIL_HEIGHT_PX,
  BUBBLE_TAIL_WIDTH_PX,
} from './bubble-path';
import type { Placement } from './bubble-placement';

const WIDTH = 300;
const HEIGHT = 120;

// path의 모든 좌표를 (x, y) 쌍으로 풀어 낸다. M/L은 1쌍, Q는 2쌍(제어점, 끝점)이다.
function readPoints(path: string): [number, number][] {
  const numbers = (path.match(/-?\d+(\.\d+)?/g) ?? []).map(Number);
  const points: [number, number][] = [];
  for (let i = 0; i < numbers.length; i += 2) {
    points.push([numbers[i], numbers[i + 1]]);
  }
  return points;
}

function buildWithTail(placement: Placement, offset: number) {
  return buildBubblePath({
    width: WIDTH,
    height: HEIGHT,
    tail: { placement, offset },
  });
}

describe('buildBubblePath', () => {
  it('크기가 0이면 빈 path를 반환한다', () => {
    expect(buildBubblePath({ width: 0, height: HEIGHT, tail: null })).toBe('');
    expect(buildBubblePath({ width: WIDTH, height: 0, tail: null })).toBe('');
  });

  it('꼬리가 없으면 본체 박스 밖으로 나가지 않는 닫힌 path이다', () => {
    // given / when
    const path = buildBubblePath({ width: WIDTH, height: HEIGHT, tail: null });
    const points = readPoints(path);

    // then
    expect(path.startsWith('M')).toBe(true);
    expect(path.endsWith('Z')).toBe(true);
    expect(points.every(([x]) => 0 <= x && x <= WIDTH)).toBe(true);
    expect(points.every(([, y]) => 0 <= y && y <= HEIGHT)).toBe(true);
  });

  it('말풍선이 타겟 아래(bottom)에 있으면 꼬리는 위쪽 변에서 위로 나간다', () => {
    // given / when
    const points = readPoints(buildWithTail('bottom', 100));

    // then
    expect(points).toContainEqual([100, -BUBBLE_TAIL_HEIGHT_PX]);
  });

  it('말풍선이 타겟 위(top)에 있으면 꼬리는 아래쪽 변에서 아래로 나간다', () => {
    // given / when
    const points = readPoints(buildWithTail('top', 100));

    // then
    expect(points).toContainEqual([100, HEIGHT + BUBBLE_TAIL_HEIGHT_PX]);
  });

  it('말풍선이 타겟 오른쪽(right)에 있으면 꼬리는 왼쪽 변에서 왼쪽으로 나간다', () => {
    // given / when
    const points = readPoints(buildWithTail('right', 60));

    // then
    expect(points).toContainEqual([-BUBBLE_TAIL_HEIGHT_PX, 60]);
  });

  it('말풍선이 타겟 왼쪽(left)에 있으면 꼬리는 오른쪽 변에서 오른쪽으로 나간다', () => {
    // given / when
    const points = readPoints(buildWithTail('left', 60));

    // then
    expect(points).toContainEqual([WIDTH + BUBBLE_TAIL_HEIGHT_PX, 60]);
  });

  it('꼬리가 있어도 path는 M으로 시작해 Z로 닫힌다', () => {
    // given
    const placements: Placement[] = ['top', 'bottom', 'left', 'right'];

    // when / then
    for (const placement of placements) {
      const path = buildWithTail(placement, 60);
      expect(path.startsWith('M')).toBe(true);
      expect(path.endsWith('Z')).toBe(true);
    }
  });

  it('꼬리 위치가 모서리 쪽으로 치우치면 둥근 모서리 구간을 침범하지 않게 안쪽으로 밀린다', () => {
    // given: 왼쪽 끝(0)과 오른쪽 끝(WIDTH)을 넘는 위치
    const minX = BUBBLE_BORDER_RADIUS_PX + BUBBLE_TAIL_WIDTH_PX / 2;
    const maxX = WIDTH - minX;

    // when
    const leftmost = readPoints(buildWithTail('bottom', 0));
    const rightmost = readPoints(buildWithTail('bottom', WIDTH));

    // then
    expect(leftmost).toContainEqual([minX, -BUBBLE_TAIL_HEIGHT_PX]);
    expect(rightmost).toContainEqual([maxX, -BUBBLE_TAIL_HEIGHT_PX]);
  });
});
