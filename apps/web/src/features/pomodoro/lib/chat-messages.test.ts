import type { ChatMessage } from '@pomodoro/shared';
import {
  getLastMessageId,
  hasUnreadMessage,
  mergeChatMessages,
} from './chat-messages';

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

describe('getLastMessageId', () => {
  it('마지막 메시지의 번호를 돌려준다', () => {
    expect(getLastMessageId([createMessage(1), createMessage(7)])).toBe(7);
  });

  it('메시지가 없으면 0을 돌려준다', () => {
    expect(getLastMessageId([])).toBe(0);
  });
});

describe('hasUnreadMessage', () => {
  it.each([
    {
      name: '읽은 번호 뒤에 다른 사람의 메시지가 있으면',
      lastReadId: 1,
      selfId: 'me',
      expected: true,
    },
    {
      name: '마지막 메시지까지 읽었으면',
      lastReadId: 2,
      selfId: 'me',
      expected: false,
    },
    {
      name: '읽은 번호 뒤가 내 메시지뿐이면',
      lastReadId: 1,
      selfId: 'participant-1',
      expected: false,
    },
  ])('$name $expected를 돌려준다', ({ lastReadId, selfId, expected }) => {
    // given: 모두 participant-1이 보낸 메시지
    const messages = [createMessage(1), createMessage(2)];

    // when
    const hasUnread = hasUnreadMessage(messages, lastReadId, selfId);

    // then
    expect(hasUnread).toBe(expected);
  });
});
