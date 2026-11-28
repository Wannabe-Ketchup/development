export interface CoachMarkSpotlightProps {
  // 밝힐 영역들. 비어 있으면 화면 전체를 어둡게 한다
  targetRects: readonly DOMRect[];
  paddingPx?: number;
  borderRadiusPx?: number;
  reduceMotion: boolean;
  isAnimating: boolean;
  onOverlayClick: () => void;
}

export const SPOTLIGHT_TRANSITION_MS = 300;
export const SPOTLIGHT_PADDING_PX = 12;
export const SPOTLIGHT_BORDER_RADIUS_PX = 12;
const MIN_SPOTLIGHT_SIZE_PX = 40;

export function CoachMarkSpotlight({
  targetRects,
  paddingPx = SPOTLIGHT_PADDING_PX,
  borderRadiusPx = SPOTLIGHT_BORDER_RADIUS_PX,
  reduceMotion,
  isAnimating,
  onOverlayClick,
}: CoachMarkSpotlightProps) {
  // 스텝 전환 때만 구멍을 부드럽게 옮긴다. 리사이즈 같은 추적 갱신에는 transition을 걸지 않아 타겟에 붙어 다닌다.
  const holeTransition =
    reduceMotion || !isAnimating
      ? 'none'
      : `all ${SPOTLIGHT_TRANSITION_MS}ms ease`;

  const holes = targetRects.map((targetRect) => ({
    x: targetRect.x - paddingPx,
    y: targetRect.y - paddingPx,
    width: Math.max(targetRect.width + paddingPx * 2, MIN_SPOTLIGHT_SIZE_PX),
    height: Math.max(targetRect.height + paddingPx * 2, MIN_SPOTLIGHT_SIZE_PX),
  }));

  // 구멍을 뺀 영역만 클릭을 받는다. clip-path는 히트 테스트에 반영되므로 구멍 안의 클릭은 아래 요소로 통과한다.
  // (svg mask는 그림만 뚫을 뿐 히트 테스트에는 영향이 없어서 차단 레이어를 따로 둔다.)
  // 구멍마다 시작점으로 돌아오는 고리를 이어 붙인다. evenodd라 고리 안쪽이 비고, 이어 주는 선은 두께가 없다
  const holePolygonPoints = holes
    .map(
      ({ x, y, width, height }) =>
        `${x}px ${y}px, ${x}px ${y + height}px, ${x + width}px ${y + height}px, ${x + width}px ${y}px, ${x}px ${y}px`,
    )
    .join(', ');
  const blockerClipPath =
    holes.length > 0
      ? `polygon(evenodd, 0 0, 100% 0, 100% 100%, 0 100%, 0 0, ${holePolygonPoints})`
      : undefined;

  return (
    <>
      <svg
        className="pointer-events-none fixed inset-0 z-40 h-full w-full"
        aria-hidden="true"
      >
        <defs>
          <mask id="spotlight-mask">
            <rect width="100%" height="100%" fill="white" />
            {holes.map((hole, index) => (
              <rect
                key={index}
                x={hole.x}
                y={hole.y}
                width={hole.width}
                height={hole.height}
                rx={borderRadiusPx}
                ry={borderRadiusPx}
                fill="black"
                style={{ transition: holeTransition }}
              />
            ))}
          </mask>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="rgba(0,0,0,0.6)"
          mask="url(#spotlight-mask)"
        />
      </svg>
      {/* oxlint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events -- intentional overlay click to close tour; keyboard close is handled by Escape/닫기 버튼 */}
      <div
        className="pointer-events-auto fixed inset-0 z-40"
        aria-hidden="true"
        style={{ clipPath: blockerClipPath }}
        onClick={onOverlayClick}
      />
    </>
  );
}
