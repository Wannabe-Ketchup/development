import type { ChatMessage } from '../../types/chat-message.js';

// 저장된 메시지. 재전송이면 처음 저장된 메시지다
export type SendChatMessageResponse = ChatMessage;
