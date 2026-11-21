import { BadRequestException } from '@nestjs/common';
import {
  CHAT_MESSAGE_MAX_LENGTH,
  type ChatMessage as ChatMessageShape,
} from '@pomodoro/shared';

const LINE_BREAK_PATTERN = /[\r\n]/;

export class ChatMessage implements ChatMessageShape {
  private constructor(
    public readonly id: number,
    public readonly senderId: string,
    // 재전송 중복 확인에만 쓴다. 응답·이벤트(ChatMessageShape)에는 넣지 않는다
    public readonly clientMessageId: string,
    public readonly nickname: string,
    public readonly content: string,
    public readonly sentAt: string,
  ) {}

  // 앞뒤 공백을 지운 뒤 검사하고, 지운 값을 저장한다
  static create(props: {
    id: number;
    senderId: string;
    clientMessageId: string;
    nickname: string;
    content: string;
    sentAt: string;
  }): ChatMessage {
    const content = props.content.trim();
    ChatMessage.validateContent(content);

    return new ChatMessage(
      props.id,
      props.senderId,
      props.clientMessageId,
      props.nickname,
      content,
      props.sentAt,
    );
  }

  private static validateContent(content: string): void {
    if (content.length === 0) {
      throw new BadRequestException('메시지를 입력해 주세요.');
    }

    if (content.length > CHAT_MESSAGE_MAX_LENGTH) {
      throw new BadRequestException(
        `메시지는 ${CHAT_MESSAGE_MAX_LENGTH}자 이내입니다.`,
      );
    }

    if (LINE_BREAK_PATTERN.test(content)) {
      throw new BadRequestException('메시지에 줄바꿈을 쓸 수 없습니다.');
    }
  }
}
