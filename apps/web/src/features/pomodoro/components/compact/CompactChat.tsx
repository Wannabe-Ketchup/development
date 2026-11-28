import { useRef } from 'react';
import { WobblyBox } from '@squiggle-line/react';
import ChatSvg from '@/assets/chat.svg?react';
import type { CompactLayout } from '@/lib/viewport-mode';
import { useChat } from '../../hooks/useChat';
import type { RoomChat } from '../../hooks/useRoomSession';
import { ChatSheet } from './ChatSheet';

const UNREAD_DOT_WOBBLY = {
  wiggle: 40,
  frequency: 400,
  smoothen: 10,
  strokeWidth: 2,
  borderRadius: 999,
  pathClassName: 'fill-tomato-body-4 stroke-black',
};
const CIRCLE_WOBBLY = {
  wiggle: 5,
  frequency: 500,
  smoothen: 12,
  strokeWidth: 3,
  borderRadius: 999,
  pathClassName: 'fill-white stroke-black',
};

interface CompactChatProps {
  layout: CompactLayout;
  selfParticipantId: string;
  chat: RoomChat;
  // 시트를 열기 직전에 호출된다. page는 여기서 투어를 닫는다
  onOpen: () => void;
}

// 하단 조작 줄 오른쪽 끝의 채팅 버튼과, 누르면 올라오는 시트
export function CompactChat({
  layout,
  selfParticipantId,
  chat: roomChat,
  onOpen,
}: CompactChatProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const chat = useChat({ selfParticipantId, chat: roomChat });

  const handleOpen = () => {
    onOpen();
    chat.open();
  };

  // 시트가 사라진 뒤 열기 버튼으로 포커스를 돌려준다
  const handleClose = () => {
    chat.close();
    buttonRef.current?.focus();
  };

  return (
    <>
      <div data-tour-id="chat" className="relative">
        <WobblyBox {...CIRCLE_WOBBLY}>
          <button
            ref={buttonRef}
            type="button"
            aria-haspopup="dialog"
            onClick={handleOpen}
            className="relative flex size-12 items-center justify-center"
          >
            <ChatSvg aria-hidden="true" className="size-6.5" />
            {/* 데스크톱 채팅 버튼과 같은 접근 가능한 이름("chat")을 유지한다 */}
            <span className="sr-only">chat</span>
            {chat.hasUnread && (
              <span className="sr-only">안 읽은 메시지 있음</span>
            )}
          </button>
        </WobblyBox>
        {chat.hasUnread && (
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
      {chat.isOpen && (
        <ChatSheet
          layout={layout}
          messages={roomChat.messages}
          selfParticipantId={selfParticipantId}
          draft={chat.draft}
          sendState={chat.sendState}
          canSend={chat.canSend}
          onDraftChange={chat.changeDraft}
          onSend={() => void chat.send()}
          onClose={handleClose}
        />
      )}
    </>
  );
}
