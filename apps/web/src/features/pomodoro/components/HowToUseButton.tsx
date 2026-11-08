import { forwardRef } from 'react';
import { cn } from '@/lib/cn';
import { PILL_CONTENT_CLASS_NAME, SquigglePill } from './SquigglePill';

export interface HowToUseButtonProps {
  isOpen: boolean;
  onClick: () => void;
  className?: string;
}

export const HowToUseButton = forwardRef<
  HTMLButtonElement,
  HowToUseButtonProps
>(function HowToUseButton({ isOpen, onClick, className }, ref) {
  return (
    <div className={cn('absolute bottom-8 left-8 z-20', className)}>
      <SquigglePill>
        <button
          ref={ref}
          type="button"
          aria-label="how to use"
          aria-expanded={isOpen}
          aria-controls="coach-mark-tour"
          onClick={onClick}
          className={PILL_CONTENT_CLASS_NAME}
        >
          how to use
        </button>
      </SquigglePill>
    </div>
  );
});
