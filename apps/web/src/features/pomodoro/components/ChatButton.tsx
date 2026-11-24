import type { Ref } from 'react';
import {
  PILL_CONTENT_CLASS_NAME,
  SquigglePill,
} from '@/components/SquigglePill';

interface ChatButtonProps {
  ref?: Ref<HTMLButtonElement>;
  onClick: () => void;
}

export function ChatButton({ ref, onClick }: ChatButtonProps) {
  return (
    <SquigglePill>
      <button
        ref={ref}
        type="button"
        onClick={onClick}
        className={PILL_CONTENT_CLASS_NAME}
      >
        chat
      </button>
    </SquigglePill>
  );
}
