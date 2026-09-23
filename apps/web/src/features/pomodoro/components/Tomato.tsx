import TomatoIcon from '@/assets/tomato.svg?react';
import { cn } from '@/lib/cn';

interface TomatoProps {
  isPending: boolean;
  className?: string;
}

export function Tomato({ isPending, className }: TomatoProps) {
  return (
    <div className={cn('flex flex-col items-center', className)}>

      <div className={cn('relative', isPending && 'opacity-40 grayscale')}>
        <TomatoIcon className="w-28 max-w-none" />

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
