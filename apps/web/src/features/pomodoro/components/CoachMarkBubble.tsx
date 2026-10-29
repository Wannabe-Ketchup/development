import { useEffect, useRef, useState, type RefObject } from 'react';
import { WobblyShape } from '@squiggle-line/react';
import { buildBubblePath } from '../lib/bubble-path';
import type { BubbleTail } from '../lib/bubble-placement';

export interface CoachMarkBubbleProps {
  stepIndex: number;
  totalSteps: number;
  description: string;
  canGoPrev: boolean;
  canGoNext: boolean;
  onNext: () => void;
  onPrev: () => void;
  onClose: () => void;
  prevBtnRef: RefObject<HTMLButtonElement | null>;
  nextBtnRef: RefObject<HTMLButtonElement | null>;
  closeBtnRef: RefObject<HTMLButtonElement | null>;
  bubbleRef: RefObject<HTMLDivElement | null>;
  isReady: boolean;
  tail: BubbleTail | null;
}

const SQUIGGLE_FREQUENCY = 450;
const SQUIGGLE_WIGGLE = 5;
const SQUIGGLE_SMOOTHEN = 12;
const BUBBLE_STROKE_WIDTH_PX = 3;
// WobblyShape가 내부에서 쓰는 svg 여백 공식의 상수 (진폭 + strokeWidth + 8)
const SVG_PADDING_BASE_PX = 8;

export function CoachMarkBubble({
  stepIndex,
  totalSteps,
  description,
  canGoPrev,
  canGoNext,
  onNext,
  onPrev,
  onClose,
  prevBtnRef,
  nextBtnRef,
  closeBtnRef,
  bubbleRef,
  isReady,
  tail,
}: CoachMarkBubbleProps) {
  const currentStep = stepIndex + 1;

  const boxRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  // 설명 문구가 스텝마다 달라 말풍선 크기가 변하므로 크기를 관찰해 테두리 path를 다시 만든다.
  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;

    const observer = new ResizeObserver(() => {
      const { width, height } = box.getBoundingClientRect();
      setSize({ width, height });
    });
    observer.observe(box);
    return () => observer.disconnect();
  }, []);

  const bubblePath = buildBubblePath({
    width: size.width,
    height: size.height,
    tail,
  });

  // WobblyShape는 viewBox를 padding만큼 키우면서 svg 크기는 넘긴 width/height 그대로 쓰기 때문에,
  // 그대로 두면 그림이 padding만큼 줄어든다. 같은 공식으로 padding을 구해 svg 크기를 직접 늘려서 1:1로 맞춘다.
  const amplitude =
    Math.min(size.width, size.height) * (SQUIGGLE_WIGGLE / 100) * 0.22;
  const svgPadding =
    Math.ceil(amplitude) + BUBBLE_STROKE_WIDTH_PX + SVG_PADDING_BASE_PX;

  return (
    <div
      ref={bubbleRef}
      style={{ opacity: isReady ? 1 : 0, transition: 'opacity 0.15s ease' }}
    >
      <div ref={boxRef} className="relative">
        {bubblePath && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
          >
            <WobblyShape
              d={bubblePath}
              width={size.width}
              height={size.height}
              frequency={SQUIGGLE_FREQUENCY}
              wiggle={SQUIGGLE_WIGGLE}
              smoothen={SQUIGGLE_SMOOTHEN}
              strokeWidth={BUBBLE_STROKE_WIDTH_PX}
              pathClassName="fill-white stroke-black"
              className="absolute"
              style={{
                top: -svgPadding,
                left: -svgPadding,
                width: size.width + svgPadding * 2,
                height: size.height + svgPadding * 2,
              }}
            />
          </div>
        )}

        <div className="relative z-10 p-4">
          <div className="flex max-w-75 flex-col gap-3">
            <p className="text-lg leading-relaxed break-keep">{description}</p>
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm">
                {currentStep}/{totalSteps}단계
              </span>
              <div className="flex gap-2">
                <button
                  ref={prevBtnRef}
                  type="button"
                  disabled={!canGoPrev}
                  onClick={onPrev}
                  className="rounded-lg border-2 border-black px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-40"
                >
                  이전
                </button>
                {canGoNext ? (
                  <button
                    ref={nextBtnRef}
                    type="button"
                    onClick={onNext}
                    className="rounded-lg border-2 border-black bg-black px-3 py-1.5 text-sm text-white"
                  >
                    다음
                  </button>
                ) : (
                  <button
                    ref={nextBtnRef}
                    type="button"
                    disabled
                    className="rounded-lg border-2 border-black bg-black px-3 py-1.5 text-sm text-white opacity-40"
                  >
                    다음
                  </button>
                )}
                <button
                  ref={closeBtnRef}
                  type="button"
                  onClick={onClose}
                  className="rounded-lg border-2 border-black px-3 py-1.5 text-sm"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
