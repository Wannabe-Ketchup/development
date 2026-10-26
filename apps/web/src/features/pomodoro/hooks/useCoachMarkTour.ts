import { useState, useEffect, useCallback } from 'react';

export interface UseCoachMarkTourOptions {
  totalSteps: number;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export interface CoachMarkTourState {
  isOpen: boolean;
  stepIndex: number;
  openTour: () => void;
  closeTour: () => void;
  goNext: () => void;
  goPrev: () => void;
  canGoPrev: boolean;
  canGoNext: boolean;
}

export function useCoachMarkTour(
  options: UseCoachMarkTourOptions,
): CoachMarkTourState {
  const { totalSteps, open: controlledOpen, onOpenChange } = options;

  const isControlled = controlledOpen !== undefined;
  const [internalOpen, setInternalOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  const isOpen = isControlled ? controlledOpen : internalOpen;

  useEffect(() => {
    if (isControlled) {
      if (!controlledOpen) {
        setStepIndex(0);
      }
    }
  }, [isControlled, controlledOpen]);

  const openTour = useCallback(() => {
    setStepIndex(0);
    if (isControlled) {
      onOpenChange?.(true);
    } else {
      setInternalOpen(true);
    }
  }, [isControlled, onOpenChange]);

  const closeTour = useCallback(() => {
    if (isControlled) {
      onOpenChange?.(false);
    } else {
      setInternalOpen(false);
      setStepIndex(0);
      onOpenChange?.(false);
    }
  }, [isControlled, onOpenChange]);

  const goNext = useCallback(() => {
    setStepIndex((prev) => Math.min(prev + 1, totalSteps - 1));
  }, [totalSteps]);

  const goPrev = useCallback(() => {
    setStepIndex((prev) => Math.max(prev - 1, 0));
  }, []);

  return {
    isOpen,
    stepIndex,
    openTour,
    closeTour,
    goNext,
    goPrev,
    canGoPrev: stepIndex > 0,
    canGoNext: stepIndex < totalSteps - 1,
  };
}
