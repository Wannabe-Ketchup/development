import { forwardRef } from 'react';
import { WobblyBox } from '@squiggle-line/react';

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
      <WobblyBox
        pathClassName="stroke-black"
        strokeWidth={3}
        frequency={500}
        wiggle={5}
        smoothen={12}
        borderRadius={999}
      >
        <button
          ref={ref}
          type="button"
          aria-label="how to use"
          aria-expanded={isOpen}
          aria-controls="coach-mark-tour"
          onClick={onClick}
          className="rounded-full bg-white px-5 py-3 font-dearfromsol text-2xl"
        >
          how to use
        </button>
      </WobblyBox>
    </div>
  );
});
