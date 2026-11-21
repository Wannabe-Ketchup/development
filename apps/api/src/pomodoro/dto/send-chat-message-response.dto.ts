import type { SendChatMessageResponse as SendChatMessageResponseShape } from '@pomodoro/shared';
import type { ChatMessage } from '../domain/chat-message.entity';

// clientMessageId는 보낸 사람의 재전송 확인용이라 응답·이벤트에 넣지 않는다
export class SendChatMessageResponse implements SendChatMessageResponseShape {
  private constructor(
    readonly id: number,
    readonly senderId: string,
    readonly nickname: string,
    readonly content: string,
    readonly sentAt: string,
  ) {}

  static from(message: ChatMessage): SendChatMessageResponse {
    return new SendChatMessageResponse(
      message.id,
      message.senderId,
      message.nickname,
      message.content,
      message.sentAt,
    );
  }
}
