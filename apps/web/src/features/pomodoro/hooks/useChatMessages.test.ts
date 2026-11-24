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
  it('처음에는 메시지가 없고 첫 chat_history도 받지 않았다', () => {
    const { result } = renderHook(() => useChatMessages());

    expect(result.current.messages).toEqual([]);
    expect(result.current.firstHistoryLastId).toBeNull();
  });

  it('다시 연결되어 받은 chat_history는 이미 받은 메시지를 지우지 않고 합친다', () => {
    // given
    const { result } = renderHook(() => useChatMessages());
    act(() => result.current.addChatMessage(createMessage(1)));

    // when
    act(() =>
      result.current.addChatHistory([createMessage(2), createMessage(3)]),
    );

    // then
    expect(result.current.messages.map(({ id }) => id)).toEqual([1, 2, 3]);
  });

  it.each([
    { history: [], expected: 0 },
    { history: [createMessage(1), createMessage(2)], expected: 2 },
  ])(
    '첫 chat_history의 마지막 번호 $expected를 기억한다',
    ({ history, expected }) => {
      // given
      const { result } = renderHook(() => useChatMessages());

      // when
      act(() => result.current.addChatHistory(history));

      // then
      expect(result.current.firstHistoryLastId).toBe(expected);
    },
  );

  it('다시 연결되어 온 chat_history로는 첫 chat_history의 마지막 번호가 바뀌지 않는다', () => {
    // given
    const { result } = renderHook(() => useChatMessages());
    act(() => result.current.addChatHistory([]));

    // when
    act(() => result.current.addChatHistory([createMessage(1)]));

    // then
    expect(result.current.firstHistoryLastId).toBe(0);
  });

  // 바뀌면 useRoomSSE가 연결을 끊고 다시 연다
  it('메시지를 받아도 addChatMessage와 addChatHistory는 바뀌지 않는다', () => {
    // given
    const { result } = renderHook(() => useChatMessages());
    const before = result.current;

    // when
    act(() => result.current.addChatHistory([createMessage(1)]));
    act(() => result.current.addChatMessage(createMessage(2)));

    // then
    expect(result.current.addChatMessage).toBe(before.addChatMessage);
    expect(result.current.addChatHistory).toBe(before.addChatHistory);
  });
});
