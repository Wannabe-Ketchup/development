import { useRef } from 'react';
import { useChat } from '../hooks/useChat';
import type { RoomChat } from '../hooks/useRoomSession';
import { ChatButton } from './ChatButton';
import { ChatPanel } from './ChatPanel';

interface ChatProps {
  selfParticipantId: string;
  chat: RoomChat;
  // 채팅창을 열기 직전에 호출된다. page는 여기서 투어를 닫는다
  onOpen: () => void;
}

export function Chat({ selfParticipantId, chat: roomChat, onOpen }: ChatProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const chat = useChat({ selfParticipantId, chat: roomChat });

  const handleOpen = () => {
    onOpen();
    chat.open();
  };

  const handleClose = () => {
    chat.close();
    buttonRef.current?.focus();
  };

  // squiggle 테두리는 크기를 잰 다음 프레임에 그려져, 열 때마다 새로 만들면 깜빡인다.
  // 그래서 지우지 않고 숨긴다. display: none은 크기가 0이 되어 다시 재야 하므로 visibility를 쓴다
  return (
    <div data-tour-id="chat" className="relative">
      <div style={{ visibility: chat.isOpen ? 'hidden' : undefined }}>
        <ChatButton
          ref={buttonRef}
          hasUnread={chat.hasUnread}
          onClick={handleOpen}
        />
      </div>
      <div
        className="absolute top-0 left-0 w-max"
        style={{ visibility: chat.isOpen ? undefined : 'hidden' }}
      >
        <ChatPanel
          isOpen={chat.isOpen}
          messages={roomChat.messages}
          selfParticipantId={selfParticipantId}
          draft={chat.draft}
          sendState={chat.sendState}
          canSend={chat.canSend}
          onDraftChange={chat.changeDraft}
          onSend={() => void chat.send()}
          onClose={handleClose}
        />
      </div>
    </div>
  );
}
