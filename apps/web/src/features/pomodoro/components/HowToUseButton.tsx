import { forwardRef } from 'react';
import { PILL_CONTENT_CLASS_NAME, SquigglePill } from './SquigglePill';

export interface HowToUseButtonProps {
  isOpen: boolean;
  onClick: () => void;
}

export const HowToUseButton = forwardRef<
  HTMLButtonElement,
  HowToUseButtonProps
>(function HowToUseButton({ isOpen, onClick }, ref) {
  return (
    <div className="absolute bottom-8 left-8 z-20">
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
