import { HttpException, HttpStatus } from '@nestjs/common';
import { ChatMessage } from './chat-message.entity';

// 방마다 남기는 최근 메시지 수. 넘으면 가장 오래된 것부터 지운다
export const CHAT_MESSAGES_MAX_KEPT = 100;
// 한 참여자가 이 시간 안에 이만큼 보냈으면 더 받지 않는다
export const CHAT_RATE_LIMIT_COUNT = 10;
export const CHAT_RATE_LIMIT_WINDOW_MS = 10_000;

export interface SendChatMessageResult {
  message: ChatMessage;
  // 이미 저장된 메시지의 재전송이면 true. 서비스는 이때 다시 알리지 않는다
  isResend: boolean;
}

// 한 방의 채팅 메시지 목록. Room이 들고 있지만 Room·Participant를 모른다
export class ChatMessages {
  private constructor(
    private readonly messages: ChatMessage[],
    private nextId: number,
  ) {}

  static create(): ChatMessages {
    const firstId = 1;
    return new ChatMessages([], firstId);
  }

  // 검증하지 않는다. repository 매퍼와 테스트 given에서만 호출한다
  static restore(props: {
    messages: ChatMessage[];
    nextId: number;
  }): ChatMessages {
    return new ChatMessages([...props.messages], props.nextId);
  }

  // 검사 순서: 내용 → 재전송 → 빈도 제한 → 저장
  // 빈도 제한이 재전송보다 먼저면, 이미 저장된 10번째 메시지의 재전송이 429를 받는다
  send(props: {
    senderId: string;
    clientMessageId: string;
    nickname: string;
    content: string;
    sentAt: string;
  }): SendChatMessageResult {
    const message = ChatMessage.create({ id: this.nextId, ...props });

    const sentMessage = this.findSent(props.senderId, props.clientMessageId);
    if (sentMessage) {
      return { message: sentMessage, isResend: true };
    }

    this.validateRateLimit(props.senderId, props.sentAt);

    this.messages.push(message);
    this.nextId += 1;
    if (this.messages.length > CHAT_MESSAGES_MAX_KEPT) {
      this.messages.shift();
    }

    return { message, isResend: false };
  }

  // 참여자가 입장한 뒤의 메시지. 두 값 모두 toISOString() 형식이라 문자열로 비교한다
  messagesSince(joinedAt: string): ChatMessage[] {
    return this.messages.filter((message) => message.sentAt >= joinedAt);
  }

  private findSent(
    senderId: string,
    clientMessageId: string,
  ): ChatMessage | undefined {
    return this.messages.find(
      (message) =>
        message.senderId === senderId &&
        message.clientMessageId === clientMessageId,
    );
  }

  private validateRateLimit(senderId: string, sentAt: string): void {
    const windowStartMs = Date.parse(sentAt) - CHAT_RATE_LIMIT_WINDOW_MS;
    const recentCount = this.messages.filter(
      (message) =>
        message.senderId === senderId &&
        Date.parse(message.sentAt) > windowStartMs,
    ).length;

    if (recentCount >= CHAT_RATE_LIMIT_COUNT) {
      throw new HttpException(
        '메시지를 너무 자주 보냈습니다. 잠시 후 다시 보내 주세요.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }
}
