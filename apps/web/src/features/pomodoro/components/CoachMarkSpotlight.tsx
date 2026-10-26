export interface CoachMarkSpotlightProps {
  targetRect: DOMRect | null;
  paddingPx?: number;
  borderRadiusPx?: number;
  reduceMotion: boolean;
  isAnimating: boolean;
  onOverlayClick: () => void;
}

export const SPOTLIGHT_TRANSITION_MS = 300;
const SPOTLIGHT_PADDING_PX = 12;
const SPOTLIGHT_BORDER_RADIUS_PX = 12;
const MIN_SPOTLIGHT_SIZE_PX = 40;

export function CoachMarkSpotlight({
  targetRect,
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

  const holeX = targetRect ? targetRect.x - paddingPx : 0;
  const holeY = targetRect ? targetRect.y - paddingPx : 0;
  const holeW = targetRect
    ? Math.max(targetRect.width + paddingPx * 2, MIN_SPOTLIGHT_SIZE_PX)
    : 0;
  const holeH = targetRect
    ? Math.max(targetRect.height + paddingPx * 2, MIN_SPOTLIGHT_SIZE_PX)
    : 0;

  // 구멍을 뺀 영역만 클릭을 받는다. clip-path는 히트 테스트에 반영되므로 구멍 안의 클릭은 아래 요소로 통과한다.
  // (svg mask는 그림만 뚫을 뿐 히트 테스트에는 영향이 없어서 차단 레이어를 따로 둔다.)
  const blockerClipPath = targetRect
    ? `polygon(evenodd, 0 0, 100% 0, 100% 100%, 0 100%, 0 0, ${holeX}px ${holeY}px, ${holeX}px ${holeY + holeH}px, ${holeX + holeW}px ${holeY + holeH}px, ${holeX + holeW}px ${holeY}px, ${holeX}px ${holeY}px)`
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
            {targetRect && (
              <rect
                x={holeX}
                y={holeY}
                width={holeW}
                height={holeH}
                rx={borderRadiusPx}
                ry={borderRadiusPx}
                fill="black"
                style={{ transition: holeTransition }}
              />
            )}
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
