import type { ChatMessage } from '@pomodoro/shared';
import { mergeChatMessages } from './chat-messages';

function createMessage(id: number): ChatMessage {
  return {
    id,
    senderId: 'participant-1',
    nickname: '토마토',
    content: `메시지 ${id}`,
    sentAt: '2026-01-01T00:00:00.000Z',
  };
}

function getIds(messages: ChatMessage[]): number[] {
  return messages.map((message) => message.id);
}

describe('mergeChatMessages', () => {
  it('새 메시지를 뒤에 붙인다', () => {
    // given
    const current = [createMessage(1)];

    // when
    const merged = mergeChatMessages(current, [createMessage(2)]);

    // then
    expect(getIds(merged)).toEqual([1, 2]);
  });

  it('같은 id의 메시지는 한 번만 남긴다', () => {
    // given
    const current = [createMessage(1), createMessage(2)];

    // when
    const merged = mergeChatMessages(current, [
      createMessage(2),
      createMessage(3),
    ]);

    // then
    expect(getIds(merged)).toEqual([1, 2, 3]);
  });

  it('늦게 온 앞 번호 메시지를 id 순서에 맞게 넣는다', () => {
    // given
    const current = [createMessage(1), createMessage(3)];

    // when
    const merged = mergeChatMessages(current, [createMessage(2)]);

    // then
    expect(getIds(merged)).toEqual([1, 2, 3]);
  });

  it.each([
    { name: '빈 묶음', incoming: [] },
    { name: '이미 있는 메시지뿐인 묶음', incoming: [createMessage(1)] },
  ])('$name을 받으면 기존 배열을 그대로 돌려준다', ({ incoming }) => {
    // given
    const current = [createMessage(1)];

    // when
    const merged = mergeChatMessages(current, incoming);

    // then
    expect(merged).toBe(current);
  });
});
