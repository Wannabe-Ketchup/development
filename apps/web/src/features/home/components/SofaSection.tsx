import { cn } from '@/lib/cn';
import Sofa from '@/assets/sofa.svg?react';
import TomatoSleeping from '@/assets/tomato_sleeping.svg?react';
import SnotBubble from '@/assets/snot_bubble.svg?react';
import type { TomatoState } from '../hooks/tomatoReducer';
import { useTomatoDrag } from '../hooks/useTomatoDrag';

interface SofaSectionProps {
  tomatoStatus: TomatoState['status'];
  handlers: ReturnType<typeof useTomatoDrag>['handlers'];
}

export function SofaSection({ tomatoStatus, handlers }: SofaSectionProps) {
  return (
    <div className="relative">
      <Sofa />
      <div
        className={cn(
          'absolute top-1/2 left-1/2 -translate-x-1/6 -translate-y-1/2 cursor-grab active:cursor-grabbing',
          tomatoStatus === 'sleeping'
            ? 'pointer-events-auto opacity-100'
            : 'pointer-events-none opacity-0',
        )}
        {...handlers}
      >
        <TomatoSleeping />
        <div className="absolute top-7 left-9 size-7.5 overflow-hidden">
          <SnotBubble className="animate-snot-slide" />
        </div>
      </div>
    </div>
  );
}
