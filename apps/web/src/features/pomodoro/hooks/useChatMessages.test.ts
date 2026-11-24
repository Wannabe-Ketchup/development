import { act, renderHook } from '@testing-library/react';
import type { ChatMessage } from '@pomodoro/shared';
import { useChatMessages } from './useChatMessages';

function createMessage(id: number): ChatMessage {
  return {
    id,
    senderId: 'participant-1',
    nickname: '토마토',
    content: `메시지 ${id}`,
    sentAt: '2026-01-01T00:00:00.000Z',
  };
}

describe('useChatMessages', () => {
  it('처음에는 메시지가 없다', () => {
    const { result } = renderHook(() => useChatMessages());

    expect(result.current.messages).toEqual([]);
  });

  it('다시 연결되어 받은 묶음은 이미 받은 메시지를 지우지 않고 합친다', () => {
    // given
    const { result } = renderHook(() => useChatMessages());
    act(() => result.current.addChatMessages([createMessage(1)]));

    // when
    act(() =>
      result.current.addChatMessages([createMessage(2), createMessage(3)]),
    );

    // then
    expect(result.current.messages.map(({ id }) => id)).toEqual([1, 2, 3]);
  });

  // addChatMessages가 바뀌면 useRoomSSE가 연결을 끊고 다시 연다
  it('메시지를 받아도 addChatMessages는 바뀌지 않는다', () => {
    // given
    const { result } = renderHook(() => useChatMessages());
    const before = result.current.addChatMessages;

    // when
    act(() => result.current.addChatMessages([createMessage(1)]));

    // then
    expect(result.current.addChatMessages).toBe(before);
  });
});
