import type { Ref } from 'react';
import { WobblyBox } from '@squiggle-line/react';
import ChatSvg from '@/assets/chat.svg?react';
import { SquigglePill } from '@/components/SquigglePill';

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
          // 다른 캡슐과 같은 높이 48의 원. 좁은 화면 채팅 버튼과 같은 아이콘이다
          className="relative flex size-12 items-center justify-center text-black"
        >
          <ChatSvg aria-hidden="true" className="size-6.5" />
          {/* 아이콘만 보여도 접근 가능한 이름("chat")은 유지한다 */}
          <span className="sr-only">chat</span>
          {hasUnread && <span className="sr-only">안 읽은 메시지 있음</span>}
        </button>
      </SquigglePill>
      {hasUnread && (
        <div
          aria-hidden="true"
          data-testid="chat-unread"
          className="pointer-events-none absolute -top-0.5 -right-0.5"
        >
          <WobblyBox {...UNREAD_DOT_WOBBLY}>
            <div className="size-3.5" />
          </WobblyBox>
        </div>
      )}
    </div>
  );
}
