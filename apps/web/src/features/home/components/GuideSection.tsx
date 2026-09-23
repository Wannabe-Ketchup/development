import { cn } from '@/lib/cn';
import Arrow from '@/assets/arrow.svg?react';
import type { TomatoState } from '../hooks/tomatoReducer';

interface GuideSectionProps {
  tomatoStatus: TomatoState['status'];
}

export function GuideSection({ tomatoStatus }: GuideSectionProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center gap-6 select-none',
        tomatoStatus === 'sleeping' ? 'visible' : 'invisible',
      )}
    >
      <div className="text-4xl whitespace-nowrap">move the tomato!</div>
      <Arrow />
    </div>
  );
}
