import TomatoSvg from '@/assets/tomato.svg?react';
import { cn } from '@/lib/cn';
import type { TomatoStage } from '../lib/tomato-stage';

// tomato.svg의 몸통은 currentColor로 칠해진다
const BODY_COLOR_CLASS_BY_STAGE: Record<TomatoStage, string> = {
  1: 'text-tomato-body-1',
  2: 'text-tomato-body-2',
  3: 'text-tomato-body-3',
  4: 'text-tomato-body-4',
};

interface TomatoProps {
  stage: TomatoStage;
  isPending: boolean;
  className?: string;
}

export function Tomato({ stage, isPending, className }: TomatoProps) {
  return (
    <div className={cn('flex flex-col items-center', className)}>
      <div className={cn('relative', isPending && 'opacity-40 grayscale')}>
        <TomatoSvg
          aria-hidden="true"
          className={cn('w-28 max-w-none', BODY_COLOR_CLASS_BY_STAGE[stage])}
        />

        {isPending && (
          <div
            data-testid="self-seat-pending"
            className="absolute inset-0 flex items-center justify-center"
          >
            <span className="h-8 w-8 animate-spin rounded-full border-4 border-white border-t-transparent" />
          </div>
        )}
      </div>
    </div>
  );
}
