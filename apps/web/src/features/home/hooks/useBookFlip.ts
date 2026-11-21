import { useCallback, useEffect, useRef, useState } from 'react';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import {
  FIRST_SPREAD,
  FLIP_DURATION_MS,
  JUMP_STAGGER_MS,
  SPREAD_COUNT,
  getNextSpread,
  type FlipDirection,
} from '../lib/intro-book';

// 현재 펼침과 넘김 잠금만 맡는다. 열고 닫기는 IntroBook이 맡는다
export function useBookFlip() {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [spread, setSpread] = useState(FIRST_SPREAD);
  const [isFlipping, setIsFlipping] = useState(false);
  // 렌더 사이에 두 번 들어오는 입력을 막으려고 state가 아니라 ref로 둔다
  const spreadRef = useRef(FIRST_SPREAD);
  const isLockedRef = useRef(false);
  const timerIdsRef = useRef<number[]>([]);
  // goTo·reset을 안정된 참조로 두려고 최신 값은 ref로 읽는다
  const prefersReducedMotionRef = useRef(prefersReducedMotion);
  useEffect(() => {
    prefersReducedMotionRef.current = prefersReducedMotion;
  }, [prefersReducedMotion]);

  const clearTimers = useCallback(() => {
    timerIdsRef.current.forEach((timerId) => window.clearTimeout(timerId));
    timerIdsRef.current = [];
  }, []);

  useEffect(() => clearTimers, [clearTimers]);

  const goTo = useCallback((target: number) => {
    const isOutOfRange = target < 1 || SPREAD_COUNT < target;
    if (isLockedRef.current || isOutOfRange || target === spreadRef.current) {
      return;
    }

    const isMotionReduced = prefersReducedMotionRef.current;
    const flipDurationMs = isMotionReduced ? 0 : FLIP_DURATION_MS;
    const staggerMs = isMotionReduced ? 0 : JUMP_STAGGER_MS;
    const step = target > spreadRef.current ? 1 : -1;
    const startSpread = spreadRef.current;
    const stepCount = Math.abs(target - startSpread);

    // 시간이 0이면 기다리지 않고 바로 실행한다
    const schedule = (callback: () => void, delayMs: number) => {
      if (delayMs === 0) {
        callback();
        return;
      }
      timerIdsRef.current.push(window.setTimeout(callback, delayMs));
    };

    isLockedRef.current = true;
    setIsFlipping(true);
    for (let i = 1; i <= stepCount; i += 1) {
      schedule(
        () => {
          spreadRef.current = startSpread + step * i;
          setSpread(spreadRef.current);
        },
        (i - 1) * staggerMs,
      );
    }
    // 마지막 장이 끝날 때까지 잠금을 유지한다
    schedule(
      () => {
        isLockedRef.current = false;
        setIsFlipping(false);
      },
      (stepCount - 1) * staggerMs + flipDurationMs,
    );
  }, []);

  const flip = useCallback(
    (direction: FlipDirection) => {
      goTo(getNextSpread(spreadRef.current, direction));
    },
    [goTo],
  );

  const reset = useCallback(() => {
    clearTimers();
    isLockedRef.current = false;
    spreadRef.current = FIRST_SPREAD;
    setIsFlipping(false);
    setSpread(FIRST_SPREAD);
  }, [clearTimers]);

  return { spread, isFlipping, goTo, flip, reset };
}
