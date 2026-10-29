import { useEffect, useRef } from 'react';
import { cn } from '@/lib/cn';
import SofaSvg from '@/assets/sofa.svg?react';
import TomatoSleepingSvg from '@/assets/tomato_sleeping.svg?react';
import SnotBubbleSvg from '@/assets/snot_bubble.svg?react';
import type { TomatoState } from '../hooks/tomatoReducer';
import { useTomatoDrag } from '../hooks/useTomatoDrag';

interface SofaSectionProps {
  tomatoStatus: TomatoState['status'];
  handlers: ReturnType<typeof useTomatoDrag>['handlers'];
}

export function SofaSection({ tomatoStatus, handlers }: SofaSectionProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const prevStatus = useRef(tomatoStatus);

  useEffect(() => {
    if (prevStatus.current !== 'sleeping' && tomatoStatus === 'sleeping') {
      buttonRef.current?.focus();
    }
    prevStatus.current = tomatoStatus;
  }, [tomatoStatus]);

  return (
    <div className="relative">
      <SofaSvg aria-hidden="true" />
      <button
        ref={buttonRef}
        type="button"
        aria-label="공부 시작"
        aria-hidden={tomatoStatus !== 'sleeping' || undefined}
        tabIndex={tomatoStatus === 'sleeping' ? 0 : -1}
        className={cn(
          'absolute top-1/2 left-1/2 -translate-x-1/6 -translate-y-1/2 cursor-grab active:cursor-grabbing',
          tomatoStatus === 'sleeping'
            ? 'pointer-events-auto opacity-100'
            : 'pointer-events-none opacity-0',
        )}
        {...handlers}
      >
        <TomatoSleepingSvg />
        <div className="absolute top-7 left-9 size-7.5 overflow-hidden">
          <SnotBubbleSvg aria-hidden="true" className="animate-snot-slide" />
        </div>
      </button>
    </div>
  );
}
