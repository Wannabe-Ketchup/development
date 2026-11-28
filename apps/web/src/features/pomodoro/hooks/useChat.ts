import { useState } from 'react';
import { flushSync } from 'react-dom';
import { getLastMessageId, hasUnreadMessage } from '../lib/chat-messages';
import type { RoomChat } from './useRoomSession';

interface UseChatParams {
  selfParticipantId: string;
  chat: RoomChat;
}

// 채팅창의 열림·안 읽음·쓰던 내용. 열림만 화면마다 들고, 나머지는 세션(chat)에 있다. 데스크톱 패널과 좁은 화면의 시트가 같이 쓴다
export function useChat({ selfParticipantId, chat }: UseChatParams) {
  const {
    messages,
    firstHistoryLastId,
    form,
    lastClosedId,
    changeLastClosedId,
  } = chat;
  const [isOpen, setIsOpen] = useState(false);
  // lastClosedId: 닫을 때까지 본 마지막 번호. 열려 있는 동안 온 메시지는 읽은 것으로 본다

  const open = () => setIsOpen(true);

  // 열기 버튼이 다시 보인 뒤에 포커스를 돌려줄 수 있도록, 호출하는 쪽이 이 함수가 끝난 다음 포커스를 옮긴다
  const close = () => {
    flushSync(() => {
      setIsOpen(false);
      changeLastClosedId(getLastMessageId(messages));
    });
  };

  const hasUnread =
    firstHistoryLastId !== null &&
    hasUnreadMessage(
      messages,
      Math.max(firstHistoryLastId, lastClosedId),
      selfParticipantId,
    );

  return {
    isOpen,
    open,
    close,
    hasUnread,
    draft: form.draft,
    sendState: form.state,
    canSend: form.canSend,
    changeDraft: form.changeDraft,
    send: form.send,
  };
}
