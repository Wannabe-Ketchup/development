import { useCallback, useState } from 'react';
import type { ChatMessage } from '@pomodoro/shared';
import { mergeChatMessages } from '../lib/chat-messages';

// 이 방에서 받은 메시지 목록. 방을 옮기면 페이지를 새로 불러오므로 다른 방의 메시지와 섞이지 않는다
export function useChatMessages() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const addChatMessages = useCallback((incoming: ChatMessage[]) => {
    setMessages((current) => mergeChatMessages(current, incoming));
  }, []);

  return { messages, addChatMessages };
}
