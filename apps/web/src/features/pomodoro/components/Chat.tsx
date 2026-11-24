import { useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import type { ChatMessage } from '@pomodoro/shared';
import { getLastMessageId, hasUnreadMessage } from '../lib/chat-messages';
import { useChatMessageForm } from '../hooks/useChatMessageForm';
import { ChatButton } from './ChatButton';
import { ChatPanel } from './ChatPanel';

interface ChatProps {
  roomId: string;
  selfParticipantId: string;
  messages: ChatMessage[];
  // 첫 chat_history의 마지막 번호. 아직 못 받았으면 null
  firstHistoryLastId: number | null;
  onSent: (message: ChatMessage) => void;
}

export function Chat({
  roomId,
  selfParticipantId,
  messages,
  firstHistoryLastId,
  onSent,
}: ChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  // 닫을 때까지 본 마지막 번호. 열려 있는 동안 온 메시지는 읽은 것으로 본다
  const [lastClosedId, setLastClosedId] = useState(0);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const { draft, state, canSend, changeDraft, send } = useChatMessageForm({
    roomId,
    onSent,
  });

  // 열기 버튼이 다시 보인 뒤에 포커스를 돌려준다(숨은 요소에는 포커스가 가지 않는다)
  const handleClose = () => {
    flushSync(() => {
      setIsOpen(false);
      setLastClosedId(getLastMessageId(messages));
    });
    buttonRef.current?.focus();
  };

  const hasUnread =
    firstHistoryLastId !== null &&
    hasUnreadMessage(
      messages,
      Math.max(firstHistoryLastId, lastClosedId),
      selfParticipantId,
    );

  // squiggle 테두리는 크기를 잰 다음 프레임에 그려져, 열 때마다 새로 만들면 깜빡인다.
  // 그래서 지우지 않고 숨긴다. display: none은 크기가 0이 되어 다시 재야 하므로 visibility를 쓴다
  return (
    <div className="relative">
      <div style={{ visibility: isOpen ? 'hidden' : undefined }}>
        <ChatButton
          ref={buttonRef}
          hasUnread={hasUnread}
          onClick={() => setIsOpen(true)}
        />
      </div>
      <div
        className="absolute top-0 left-0 w-max"
        style={{ visibility: isOpen ? undefined : 'hidden' }}
      >
        <ChatPanel
          isOpen={isOpen}
          messages={messages}
          selfParticipantId={selfParticipantId}
          draft={draft}
          sendState={state}
          canSend={canSend}
          onDraftChange={changeDraft}
          onSend={() => void send()}
          onClose={handleClose}
        />
      </div>
    </div>
  );
}
