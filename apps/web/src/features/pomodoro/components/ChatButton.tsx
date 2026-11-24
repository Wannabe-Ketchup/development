import type { Ref } from 'react';
import { WobblyBox } from '@squiggle-line/react';
import {
  PILL_CONTENT_CLASS_NAME,
  SquigglePill,
} from '@/components/SquigglePill';

const UNREAD_DOT_WOBBLY = {
  wiggle: 40,
  frequency: 400,
  smoothen: 10,
  strokeWidth: 2,
  borderRadius: 999,
  pathClassName: 'fill-tomato-body-4 stroke-black',
};

interface ChatButtonProps {
  ref?: Ref<HTMLButtonElement>;
  hasUnread: boolean;
  onClick: () => void;
}

export function ChatButton({ ref, hasUnread, onClick }: ChatButtonProps) {
  return (
    <div className="relative">
      <SquigglePill>
        <button
          ref={ref}
          type="button"
          onClick={onClick}
          className={PILL_CONTENT_CLASS_NAME}
        >
          chat
          {hasUnread && <span className="sr-only">안 읽은 메시지 있음</span>}
        </button>
      </SquigglePill>
      {hasUnread && (
        <div
          aria-hidden="true"
          data-testid="chat-unread"
          className="pointer-events-none absolute -top-1 -right-1.5"
        >
          <WobblyBox {...UNREAD_DOT_WOBBLY}>
            <div className="size-4" />
          </WobblyBox>
        </div>
      )}
    </div>
  );
}
