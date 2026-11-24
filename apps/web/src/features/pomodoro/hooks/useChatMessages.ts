import { useCallback, useState } from 'react';
import type { ChatMessage } from '@pomodoro/shared';
import { getLastMessageId, mergeChatMessages } from '../lib/chat-messages';

// 이 방에서 받은 메시지 목록. 방을 옮기면 페이지를 새로 불러오므로 다른 방의 메시지와 섞이지 않는다
export function useChatMessages() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  // 첫 chat_history의 마지막 번호. 새로고침하면 어디까지 읽었는지 알 수 없어 여기까지는 읽은 것으로 본다.
  // 다시 연결되어 온 chat_history로는 바뀌지 않는다. 아직 못 받았으면 null
  const [firstHistoryLastId, setFirstHistoryLastId] = useState<number | null>(
    null,
  );

  const addChatMessage = useCallback((message: ChatMessage) => {
    setMessages((current) => mergeChatMessages(current, [message]));
  }, []);

  const addChatHistory = useCallback((history: ChatMessage[]) => {
    setMessages((current) => mergeChatMessages(current, history));
    setFirstHistoryLastId((current) => current ?? getLastMessageId(history));
  }, []);

  return { messages, firstHistoryLastId, addChatMessage, addChatHistory };
}
