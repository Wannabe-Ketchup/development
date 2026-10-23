import { useRef } from 'react';

const SHAKE_KEYFRAMES: Keyframe[] = [
  { offset: 0, transform: 'translateX(0)', easing: 'ease-in-out' },
  { offset: 0.2, transform: 'translateX(-3px)', easing: 'ease-in-out' },
  { offset: 0.4, transform: 'translateX(3px)', easing: 'ease-in-out' },
  { offset: 0.6, transform: 'translateX(-3px)', easing: 'ease-in-out' },
  { offset: 0.8, transform: 'translateX(3px)', easing: 'ease-in-out' },
  { offset: 1, transform: 'translateX(0)' },
];

const SHAKE_OPTIONS: KeyframeAnimationOptions = {
  duration: 300,
  iterations: 2,
};

export function useShake<T extends HTMLElement>() {
  const ref = useRef<T>(null);

  const shake = () => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    ref.current?.animate(SHAKE_KEYFRAMES, SHAKE_OPTIONS);
  };

  return { ref, shake };
}
