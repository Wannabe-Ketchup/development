import { describe, it, expect } from 'vitest';
import {
  computeBubblePlacement,
  BUBBLE_GAP_PX,
  BUBBLE_TAIL_EDGE_MARGIN_PX,
  BUBBLE_VIEWPORT_MARGIN_PX,
} from './bubble-placement';

const VIEWPORT = { width: 1280, height: 800 };
const BUBBLE = { width: 300, height: 120 };

describe('computeBubblePlacement', () => {
  it('타겟이 중앙·충분한 공간이면 preferred 방향으로 배치한다', () => {
    // given
    const targetRect = { x: 490, y: 340, width: 300, height: 120 };

    // when
    const result = computeBubblePlacement({
      targetRect,
      bubbleSize: BUBBLE,
      viewport: VIEWPORT,
      preferredPlacement: 'bottom',
    });

    // then
    expect(result.placement).toBe('bottom');
  });

  it('선호 방향에 공간이 부족하면 bottom→top→right→left 순으로 fit 되는 첫 방향으로 배치한다', () => {
    // given: 타겟이 화면 하단이라 bottom에 공간 없음, top에는 충분한 공간
    const targetRect = { x: 490, y: 700, width: 300, height: 60 };

    // when: preferred=bottom이지만 bottom에 공간 부족 → top으로 fallback
    const result = computeBubblePlacement({
      targetRect,
      bubbleSize: BUBBLE,
      viewport: VIEWPORT,
      preferredPlacement: 'bottom',
    });

    // then
    expect(result.placement).toBe('top');
  });

  it('어느 방향에도 fit되지 않으면 공간이 가장 넓은 방향으로 배치한다', () => {
    // given: 매우 작은 뷰포트에 큰 말풍선 — 어디도 fit 안 됨
    const smallViewport = { width: 200, height: 200 };
    const largeBubble = { width: 180, height: 180 };
    // 타겟이 화면 하단에 있어 top에 공간이 가장 많음
    const targetRect = { x: 10, y: 120, width: 80, height: 60 };

    // when
    const result = computeBubblePlacement({
      targetRect,
      bubbleSize: largeBubble,
      viewport: smallViewport,
    });

    // then: 어느 방향도 안 맞지만 top(120px)이 가장 넓음
    expect(result.placement).toBe('top');
  });

  it('어느 방향이든 들어가면 fits가 true이고, 하나도 안 들어가면 false이다', () => {
    // given
    const fitTarget = { x: 490, y: 340, width: 300, height: 120 };
    const smallViewport = { width: 200, height: 200 };
    const largeBubble = { width: 180, height: 180 };
    const crampedTarget = { x: 10, y: 120, width: 80, height: 60 };

    // when
    const fitResult = computeBubblePlacement({
      targetRect: fitTarget,
      bubbleSize: BUBBLE,
      viewport: VIEWPORT,
    });
    const crampedResult = computeBubblePlacement({
      targetRect: crampedTarget,
      bubbleSize: largeBubble,
      viewport: smallViewport,
    });

    // then
    expect(fitResult.fits).toBe(true);
    expect(crampedResult.fits).toBe(false);
  });

  it('bottom/top이면 꼬리 위치(arrowOffset)가 타겟의 가로 중심을 가리킨다', () => {
    // given: 말풍선이 clamp되지 않는 중앙 타겟 (중심 x=640)
    const targetRect = { x: 490, y: 340, width: 300, height: 120 };

    // when
    const result = computeBubblePlacement({
      targetRect,
      bubbleSize: BUBBLE,
      viewport: VIEWPORT,
      preferredPlacement: 'bottom',
    });

    // then: 말풍선 왼쪽 끝 기준으로 타겟 중심까지의 거리
    expect(result.arrowOffset).toBe(640 - result.left);
  });

  it('right/left이면 꼬리 위치(arrowOffset)가 타겟의 세로 중심을 가리킨다', () => {
    // given: 중심 y=400
    const targetRect = { x: 490, y: 340, width: 300, height: 120 };

    // when
    const result = computeBubblePlacement({
      targetRect,
      bubbleSize: BUBBLE,
      viewport: VIEWPORT,
      preferredPlacement: 'right',
    });

    // then: 말풍선 위쪽 끝 기준으로 타겟 중심까지의 거리
    expect(result.placement).toBe('right');
    expect(result.arrowOffset).toBe(400 - result.top);
  });

  it('말풍선이 화면 안으로 밀려 타겟 중심에서 멀어져도 꼬리는 모서리 여백 안에 머문다', () => {
    // given: 좌상단 끝의 작은 타겟 — 말풍선이 오른쪽으로 밀려 타겟 중심이 말풍선 왼쪽 밖에 있다
    const targetRect = { x: 0, y: 300, width: 20, height: 20 };

    // when
    const result = computeBubblePlacement({
      targetRect,
      bubbleSize: BUBBLE,
      viewport: VIEWPORT,
      preferredPlacement: 'bottom',
    });

    // then
    expect(result.arrowOffset).toBe(BUBBLE_TAIL_EDGE_MARGIN_PX);
  });

  it('결과 좌표는 viewport margin 안으로 clamp된다', () => {
    // given: 타겟이 좌상단 끝에 있어 말풍선이 뷰포트 바깥으로 나가려는 상황
    const targetRect = { x: 0, y: 0, width: 50, height: 50 };

    // when
    const result = computeBubblePlacement({
      targetRect,
      bubbleSize: BUBBLE,
      viewport: VIEWPORT,
    });

    // then
    expect(result.left).toBeGreaterThanOrEqual(BUBBLE_VIEWPORT_MARGIN_PX);
    expect(result.top).toBeGreaterThanOrEqual(BUBBLE_VIEWPORT_MARGIN_PX);
    expect(result.left + BUBBLE.width).toBeLessThanOrEqual(
      VIEWPORT.width - BUBBLE_VIEWPORT_MARGIN_PX,
    );
    expect(result.top + BUBBLE.height).toBeLessThanOrEqual(
      VIEWPORT.height - BUBBLE_VIEWPORT_MARGIN_PX,
    );
  });

  it('targetRect width/height가 0이어도 유효한 좌표를 반환한다', () => {
    // given: 빈 ul(width=0, height=0) — EC-05
    const targetRect = { x: 200, y: 400, width: 0, height: 0 };

    // when
    const result = computeBubblePlacement({
      targetRect,
      bubbleSize: BUBBLE,
      viewport: VIEWPORT,
    });

    // then: 유효한 숫자이고 viewport margin 안에 있어야 함
    expect(Number.isFinite(result.left)).toBe(true);
    expect(Number.isFinite(result.top)).toBe(true);
    expect(result.left).toBeGreaterThanOrEqual(BUBBLE_VIEWPORT_MARGIN_PX);
    expect(result.top).toBeGreaterThanOrEqual(BUBBLE_VIEWPORT_MARGIN_PX);
    const gapFromTarget = Math.abs(result.top - targetRect.y);
    expect(gapFromTarget).toBeGreaterThanOrEqual(BUBBLE_GAP_PX);
  });
});
