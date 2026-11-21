import { HttpException, HttpStatus } from '@nestjs/common';
import { ChatMessage } from '../../../src/pomodoro/domain/chat-message.entity';
import {
  CHAT_MESSAGES_MAX_KEPT,
  CHAT_RATE_LIMIT_COUNT,
  ChatMessages,
} from '../../../src/pomodoro/domain/chat-messages';

const BASE_TIME_MS = Date.parse('2026-11-21T10:00:00.000Z');
const ONE_SECOND_MS = 1000;
const TEN_SECONDS_MS = 10 * ONE_SECOND_MS;
const ONE_MINUTE_MS = 60 * ONE_SECOND_MS;

// 기준 시각(10:00:00.000)에서 ms만큼 떨어진 ISO 시각
const at = (offsetMs: number): string =>
  new Date(BASE_TIME_MS + offsetMs).toISOString();

const clientMessageIdOf = (seed: number): string =>
  `00000000-0000-4000-8000-${String(seed).padStart(12, '0')}`;

// 이미 저장된 메시지. given 준비 전용
const savedMessage = (props: {
  id: number;
  sentAt: string;
  senderId?: string;
  clientMessageId?: string;
}): ChatMessage =>
  ChatMessage.restore({
    id: props.id,
    senderId: props.senderId ?? 'participant-1',
    clientMessageId: props.clientMessageId ?? clientMessageIdOf(props.id),
    nickname: '케첩',
    content: '안녕하세요',
    sentAt: props.sentAt,
  });

// 한 참여자가 보낸 메시지 count개. 첫 메시지는 firstSentAt, 이후 1초 간격
const savedMessagesFrom = (props: {
  senderId: string;
  count: number;
  firstSentAt: number;
}): ChatMessage[] =>
  Array.from({ length: props.count }, (_, index) =>
    savedMessage({
      id: index + 1,
      senderId: props.senderId,
      sentAt: at(props.firstSentAt + index * ONE_SECOND_MS),
    }),
  );

const newMessage = (props: {
  sentAt: string;
  senderId?: string;
  clientMessageId?: string;
}) => ({
  senderId: props.senderId ?? 'participant-1',
  clientMessageId: props.clientMessageId ?? clientMessageIdOf(999),
  nickname: '케첩',
  content: '새 메시지',
  sentAt: props.sentAt,
});

// 행위가 던진 HTTP 예외의 status. 던지지 않으면 undefined
const thrownStatusOf = (action: () => unknown): number | undefined => {
  try {
    action();
  } catch (error) {
    if (error instanceof HttpException) {
      return error.getStatus();
    }
    throw error;
  }
  return undefined;
};

describe('ChatMessages', () => {
  describe('send', () => {
    it('앞 메시지가 지워져 남은 수가 줄어도 다음 메시지는 이어지는 번호를 받는다', () => {
      // given
      const chatMessages = ChatMessages.restore({
        messages: [savedMessage({ id: 7, sentAt: at(0) })],
        nextId: 8,
      });

      // when
      const { message } = chatMessages.send(
        newMessage({ sentAt: at(ONE_MINUTE_MS) }),
      );

      // then
      expect(message.id).toBe(8);
    });

    it('같은 참여자가 같은 clientMessageId로 다시 보내면 저장된 메시지를 돌려주고 새로 저장하지 않는다', () => {
      // given
      const clientMessageId = clientMessageIdOf(1);
      const chatMessages = ChatMessages.restore({
        messages: [savedMessage({ id: 1, sentAt: at(0), clientMessageId })],
        nextId: 2,
      });

      // when
      const result = chatMessages.send(
        newMessage({ sentAt: at(ONE_SECOND_MS), clientMessageId }),
      );

      // then
      expect(result).toMatchObject({ isResend: true, message: { id: 1 } });
      expect(chatMessages.messagesSince(at(0))).toHaveLength(1);
    });

    it('다른 참여자가 같은 clientMessageId로 보내면 새 메시지로 저장된다', () => {
      // given
      const clientMessageId = clientMessageIdOf(1);
      const chatMessages = ChatMessages.restore({
        messages: [
          savedMessage({
            id: 1,
            sentAt: at(0),
            senderId: 'participant-2',
            clientMessageId,
          }),
        ],
        nextId: 2,
      });

      // when
      const result = chatMessages.send(
        newMessage({
          sentAt: at(ONE_SECOND_MS),
          senderId: 'participant-1',
          clientMessageId,
        }),
      );

      // then
      expect(result).toMatchObject({ isResend: false, message: { id: 2 } });
    });

    it('10초 안에 10건을 보낸 참여자는 더 보낼 수 없다', () => {
      // given
      // 첫 메시지가 보내는 시각보다 9.999초 앞이라 10건 모두 10초 안이다
      const chatMessages = ChatMessages.restore({
        messages: savedMessagesFrom({
          senderId: 'participant-1',
          count: CHAT_RATE_LIMIT_COUNT,
          firstSentAt: 1,
        }),
        nextId: CHAT_RATE_LIMIT_COUNT + 1,
      });

      // when & then
      expect(
        thrownStatusOf(() =>
          chatMessages.send(newMessage({ sentAt: at(TEN_SECONDS_MS) })),
        ),
      ).toBe(HttpStatus.TOO_MANY_REQUESTS);
    });

    it('10건 중 가장 오래된 메시지가 정확히 10초 전이면 세지 않아 보낼 수 있다', () => {
      // given
      const chatMessages = ChatMessages.restore({
        messages: savedMessagesFrom({
          senderId: 'participant-1',
          count: CHAT_RATE_LIMIT_COUNT,
          firstSentAt: 0,
        }),
        nextId: CHAT_RATE_LIMIT_COUNT + 1,
      });

      // when
      const { message } = chatMessages.send(
        newMessage({ sentAt: at(TEN_SECONDS_MS) }),
      );

      // then
      expect(message.id).toBe(CHAT_RATE_LIMIT_COUNT + 1);
    });

    it('다른 참여자가 보낸 메시지는 내 빈도 제한에 세지 않는다', () => {
      // given
      const chatMessages = ChatMessages.restore({
        messages: savedMessagesFrom({
          senderId: 'participant-2',
          count: CHAT_RATE_LIMIT_COUNT,
          firstSentAt: 1,
        }),
        nextId: CHAT_RATE_LIMIT_COUNT + 1,
      });

      // when
      const { message } = chatMessages.send(
        newMessage({ sentAt: at(TEN_SECONDS_MS), senderId: 'participant-1' }),
      );

      // then
      expect(message.id).toBe(CHAT_RATE_LIMIT_COUNT + 1);
    });

    it('빈도 제한에 걸린 참여자도 이미 저장된 메시지를 다시 보내면 저장된 메시지를 돌려받는다', () => {
      // given
      const messages = savedMessagesFrom({
        senderId: 'participant-1',
        count: CHAT_RATE_LIMIT_COUNT,
        firstSentAt: 1,
      });
      const lastMessage = messages[messages.length - 1];
      const chatMessages = ChatMessages.restore({
        messages,
        nextId: CHAT_RATE_LIMIT_COUNT + 1,
      });

      // when
      const result = chatMessages.send(
        newMessage({
          sentAt: at(TEN_SECONDS_MS),
          clientMessageId: lastMessage.clientMessageId,
        }),
      );

      // then
      expect(result).toMatchObject({
        isResend: true,
        message: { id: lastMessage.id },
      });
    });

    it('100개가 쌓인 뒤 메시지를 저장하면 가장 오래된 메시지가 지워진다', () => {
      // given
      // 빈도 제한에 걸리지 않도록 1분 간격으로 보낸 메시지
      const messages = Array.from(
        { length: CHAT_MESSAGES_MAX_KEPT },
        (_, index) =>
          savedMessage({ id: index + 1, sentAt: at(index * ONE_MINUTE_MS) }),
      );
      const chatMessages = ChatMessages.restore({
        messages,
        nextId: CHAT_MESSAGES_MAX_KEPT + 1,
      });

      // when
      chatMessages.send(
        newMessage({ sentAt: at(CHAT_MESSAGES_MAX_KEPT * ONE_MINUTE_MS) }),
      );

      // then
      const keptIds = chatMessages.messagesSince(at(0)).map(({ id }) => id);
      expect(keptIds).toHaveLength(CHAT_MESSAGES_MAX_KEPT);
      expect(keptIds[0]).toBe(2);
    });
  });

  describe('messagesSince', () => {
    it('입장 시각과 같거나 그 뒤에 보낸 메시지만 고른다', () => {
      // given
      const joinedAt = at(0);
      const chatMessages = ChatMessages.restore({
        messages: [
          savedMessage({ id: 1, sentAt: at(-1) }),
          savedMessage({ id: 2, sentAt: at(0) }),
          savedMessage({ id: 3, sentAt: at(1) }),
        ],
        nextId: 4,
      });

      // when
      const messages = chatMessages.messagesSince(joinedAt);

      // then
      expect(messages.map(({ id }) => id)).toEqual([2, 3]);
    });
  });
});
