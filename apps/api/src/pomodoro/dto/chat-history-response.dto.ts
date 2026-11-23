import type { ChatHistory } from '@pomodoro/shared';
import type { ChatMessage } from '../domain/chat-message.entity';
import { SendChatMessageResponse } from './send-chat-message-response.dto';

export class ChatHistoryResponse implements ChatHistory {
  private constructor(readonly messages: SendChatMessageResponse[]) {}

  static from(messages: ChatMessage[]): ChatHistoryResponse {
    return new ChatHistoryResponse(
      messages.map((message) => SendChatMessageResponse.from(message)),
    );
  }
}
