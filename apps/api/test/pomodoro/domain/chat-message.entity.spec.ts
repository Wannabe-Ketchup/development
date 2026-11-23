import { BadRequestException } from '@nestjs/common';
import { CHAT_MESSAGE_MAX_LENGTH } from '@pomodoro/shared';
import { ChatMessage } from '../../../src/pomodoro/domain/chat-message.entity';

const sendMessage = (content: string): ChatMessage =>
  ChatMessage.create({
    id: 1,
    senderId: 'participant-1',
    clientMessageId: '00000000-0000-4000-8000-000000000001',
    nickname: '케첩',
    content,
    sentAt: '2026-11-21T00:00:00.000Z',
  });

describe('ChatMessage', () => {
  describe('create', () => {
    it('앞뒤 공백은 지우고 가운데 공백은 남긴 내용으로 메시지가 만들어진다', () => {
      // when
      const message = sendMessage('  집중 끝!  ');

      // then
      expect(message.content).toBe('집중 끝!');
    });

    it.each([
      { label: '빈 문자열', content: '' },
      { label: '공백', content: '   ' },
      { label: '탭과 공백', content: '\t ' },
    ])('$label만 있는 메시지는 보낼 수 없다', ({ content }) => {
      // when & then
      expect(() => sendMessage(content)).toThrow(BadRequestException);
    });

    it('100자 메시지는 보낼 수 있다', () => {
      // given
      const content = '가'.repeat(CHAT_MESSAGE_MAX_LENGTH);

      // when
      const message = sendMessage(content);

      // then
      expect(message.content).toBe(content);
    });

    it('100자를 넘는 메시지는 보낼 수 없다', () => {
      // given
      const content = '가'.repeat(CHAT_MESSAGE_MAX_LENGTH + 1);

      // when & then
      expect(() => sendMessage(content)).toThrow(BadRequestException);
    });

    it('앞뒤 공백을 지운 뒤 100자이면 공백을 포함해 100자를 넘어도 보낼 수 있다', () => {
      // given
      const text = '가'.repeat(CHAT_MESSAGE_MAX_LENGTH);
      const content = ` ${text} `;

      // when
      const message = sendMessage(content);

      // then
      expect(message.content).toBe(text);
    });

    it.each([
      { label: '\\n', content: '안녕\n하세요' },
      { label: '\\r', content: '안녕\r하세요' },
      { label: '\\r\\n', content: '안녕\r\n하세요' },
    ])(
      '내용 가운데 줄바꿈($label)이 있는 메시지는 보낼 수 없다',
      ({ content }) => {
        // when & then
        expect(() => sendMessage(content)).toThrow(BadRequestException);
      },
    );
  });
});
