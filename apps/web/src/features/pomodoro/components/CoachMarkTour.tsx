// oxlint-disable jsx-a11y/prefer-tag-over-role -- role="dialog" on div is intentional; non-modal tour rendered via portal, native <dialog> behavior conflicts
import {
  useRef,
  useEffect,
  useLayoutEffect,
  type RefObject,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { COACH_MARK_STEPS } from '../lib/coach-mark-steps';
import {
  computeBubblePlacement,
  type BubbleTail,
} from '../lib/bubble-placement';
import { useTargetRect } from '../hooks/useTargetRect';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';
import {
  CoachMarkSpotlight,
  SPOTLIGHT_TRANSITION_MS,
} from './CoachMarkSpotlight';
import { CoachMarkBubble } from './CoachMarkBubble';
import { useState } from 'react';

export interface CoachMarkTourProps {
  isOpen: boolean;
  stepIndex: number;
  totalSteps: number;
  canGoPrev: boolean;
  canGoNext: boolean;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
  triggerRef: RefObject<HTMLButtonElement | null>;
}

const TRANSITION_DURATION_MS = 150;
// 포커스 이동 낭독("다음, 버튼")이 끝난 뒤에 단계 안내가 이어서 읽히도록 포커스 이동 이후로 늦춘다.
const LIVE_ANNOUNCE_DELAY_MS = TRANSITION_DURATION_MS + 150;

// 하이라이트된 영역의 입력 필드(닉네임·상태 메시지)에 사용자가 입력 중인지 판단한다.
// 이때는 투어가 포커스를 가져가거나 Escape로 닫으면 편집이 깨진다.
function isTypingOutsideDialog(
  dialogEl: HTMLElement | null,
  el: EventTarget | Element | null,
): boolean {
  return el instanceof HTMLInputElement && !dialogEl?.contains(el);
}

export function CoachMarkTour({
  isOpen,
  stepIndex,
  totalSteps,
  canGoPrev,
  canGoNext,
  onClose,
  onNext,
  onPrev,
  triggerRef,
}: CoachMarkTourProps): ReactNode {
  const step = COACH_MARK_STEPS[stepIndex];
  const targetRect = useTargetRect(isOpen ? step.selector : null);
  const reduceMotion = usePrefersReducedMotion();

  const prevBtnRef = useRef<HTMLButtonElement>(null);
  const nextBtnRef = useRef<HTMLButtonElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  const [bubbleStyle, setBubbleStyle] = useState<{
    left: number;
    top: number;
    tail: BubbleTail | null;
  } | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isSpotlightAnimating, setIsSpotlightAnimating] = useState(false);

  // 스텝이 바뀐 직후에만 스포트라이트를 애니메이션한다. 최초 오픈과 리사이즈 추적에는 켜지 않는다.
  const prevStepIndexRef = useRef(stepIndex);
  useEffect(() => {
    if (prevStepIndexRef.current === stepIndex) return;
    prevStepIndexRef.current = stepIndex;

    setIsSpotlightAnimating(true);
    const timer = setTimeout(
      () => setIsSpotlightAnimating(false),
      SPOTLIGHT_TRANSITION_MS,
    );
    return () => clearTimeout(timer);
  }, [stepIndex]);

  // 스텝 변경 시 isReady 초기화
  useEffect(() => {
    setIsReady(false);
    setBubbleStyle(null);
  }, [stepIndex]);

  // bubble 배치 계산 (레이아웃 측정 후)
  useLayoutEffect(() => {
    if (!isOpen) return;

    const bubbleEl = bubbleRef.current;
    if (!bubbleEl) return;

    const bubbleRect = bubbleEl.getBoundingClientRect();
    const bubbleSize = { width: bubbleRect.width, height: bubbleRect.height };

    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight,
    };

    const baseTargetRect = targetRect ?? {
      x: viewport.width / 2,
      y: viewport.height / 2,
      width: 0,
      height: 0,
    };

    const result = computeBubblePlacement({
      targetRect: baseTargetRect,
      bubbleSize,
      viewport,
      preferredPlacement: step.preferredPlacement,
    });

    // 타겟이 없거나 어느 방향에도 들어가지 못해 타겟과 겹칠 수 있으면 꼬리를 숨긴다.
    const canShowTail = targetRect !== null && result.fits;
    setBubbleStyle({
      left: result.left,
      top: result.top,
      tail: canShowTail
        ? { placement: result.placement, offset: result.arrowOffset }
        : null,
    });
    setIsReady(true);
  }, [isOpen, stepIndex, targetRect, step.preferredPlacement]);

  // live region은 투어가 닫혀 있을 때도 DOM에 상주시킨다. 내용과 함께 새로 삽입된 영역은 스크린 리더가 읽지 않는 경우가 많아서,
  // 비어 있는 영역에 열린 뒤 텍스트를 채워 "변경"으로 감지되게 한다.
  const [liveText, setLiveText] = useState('');
  useEffect(() => {
    if (!isOpen) {
      setLiveText('');
      return;
    }
    const timer = setTimeout(
      () =>
        setLiveText(
          `${totalSteps}단계 중 ${stepIndex + 1}단계. ${step.description}`,
        ),
      LIVE_ANNOUNCE_DELAY_MS,
    );
    return () => clearTimeout(timer);
  }, [isOpen, stepIndex, totalSteps, step.description]);

  // 투어 열릴 때 포커스 이동 (첫 활성 버튼)
  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      if (isTypingOutsideDialog(dialogRef.current, document.activeElement)) {
        return;
      }
      if (canGoNext) {
        nextBtnRef.current?.focus();
      } else {
        closeBtnRef.current?.focus();
      }
    }, TRANSITION_DURATION_MS);
    return () => clearTimeout(timer);
  }, [isOpen, stepIndex, canGoNext]);

  // 닫힘 시 트리거로 포커스 복원. 언마운트 시점의 ref 값을 사용해야 하므로 effect 안에서 변수에 캡처한다.
  useEffect(() => {
    const trigger = triggerRef.current;
    return () => {
      trigger?.focus();
    };
  }, [triggerRef]);

  // 타겟 소실 시 자동 skip (EC-04)
  // 초기 렌더 시 targetRect는 아직 측정되지 않아 null이다. 이 경우는 소실이 아니므로 skip하지 않는다.
  // 한 번이라도 DOMRect가 반환된 이후 null이 된 경우만 소실로 판단한다.
  const hadTargetRef = useRef(false);
  useEffect(() => {
    if (targetRect !== null) {
      hadTargetRef.current = true;
    }
  }, [targetRect]);

  useEffect(() => {
    if (!isOpen) return;
    if (targetRect === null && hadTargetRef.current) {
      if (canGoNext) {
        onNext();
      } else {
        onClose();
      }
    }
  }, [isOpen, targetRect, canGoNext, onNext, onClose]);

  // Escape는 포커스 위치에 무관하게 투어를 닫을 수 있도록 document 레벨에서 처리한다.
  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (event: KeyboardEvent) => {
      // 입력 필드에서 누른 Escape는 편집 취소에 맡기고 투어는 닫지 않는다.
      if (isTypingOutsideDialog(dialogRef.current, event.target)) return;

      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  const liveRegion = (
    <div aria-live="polite" aria-atomic="true" className="sr-only">
      {liveText}
    </div>
  );

  if (!isOpen) return liveRegion;

  return (
    <>
      {liveRegion}
      {createPortal(
        <div
          ref={dialogRef}
          role="dialog"
          aria-label="뽀모도로 사용법"
          id="coach-mark-tour"
          className="pointer-events-none fixed inset-0 z-40"
        >
          <CoachMarkSpotlight
            targetRect={targetRect}
            reduceMotion={reduceMotion}
            isAnimating={isSpotlightAnimating}
            onOverlayClick={onClose}
          />

          {/* 말풍선: spotlight 위에 절대 배치 */}
          <div className="pointer-events-none fixed inset-0 z-50">
            <div
              className="pointer-events-auto absolute"
              style={
                bubbleStyle
                  ? { left: bubbleStyle.left, top: bubbleStyle.top }
                  : { left: 0, top: 0 }
              }
            >
              <CoachMarkBubble
                stepIndex={stepIndex}
                totalSteps={totalSteps}
                description={step.description}
                canGoPrev={canGoPrev}
                canGoNext={canGoNext}
                onNext={onNext}
                onPrev={onPrev}
                onClose={onClose}
                prevBtnRef={prevBtnRef}
                nextBtnRef={nextBtnRef}
                closeBtnRef={closeBtnRef}
                bubbleRef={bubbleRef}
                isReady={isReady}
                tail={bubbleStyle?.tail ?? null}
              />
            </div>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
