import { describe, it, expect, vi, type Mock } from 'vitest';
import { renderHook } from '@testing-library/react';
import {
  BREAK_DURATION_SECONDS,
  CYCLE_COUNT,
  FOCUS_DURATION_SECONDS,
  ROOM_MODE,
  type ChatMessage,
  type Room,
  type SseEventPayload,
} from '@pomodoro/shared';
import { createRoomSseConnection, type SseCallbacks } from '@/api/sse';
import { useRoomSSE } from './useRoomSSE';

vi.mock('@/api/sse');

const mockCreateRoomSseConnection = createRoomSseConnection as unknown as Mock;

describe('useRoomSSE', () => {
  it.each([
    { type: 'room_state', isReset: false },
    { type: 'pomodoro_reset', isReset: true },
  ] as const)(
    '$type 이벤트를 받으면 방 상태와 함께 리셋 여부 $isReset을 넘긴다',
    ({ type, isReset }) => {
      // given
      const room: Room = {
        roomId: 'room-1',
        mode: ROOM_MODE.IDLE,
        currentCycle: 0,
        timer: {
          status: 'IDLE',
          focusTimeSec: FOCUS_DURATION_SECONDS,
          breakTimeSec: BREAK_DURATION_SECONDS,
          totalCycle: CYCLE_COUNT,
          timerStartedAt: null,
          remainingTimeSec: FOCUS_DURATION_SECONDS,
        },
        participants: [],
      };
      let callbacks: SseCallbacks | undefined;
      mockCreateRoomSseConnection.mockImplementation(
        (_roomId: string, given: SseCallbacks) => {
          callbacks = given;
          return { close: vi.fn() };
        },
      );
      const onRoomState = vi.fn();
      renderHook(() =>
        useRoomSSE('room-1', true, onRoomState, vi.fn(), vi.fn()),
      );

      // when
      callbacks?.onMessage({ type, data: room });

      // then
      expect(onRoomState).toHaveBeenCalledWith(room, { isReset });
    },
  );

  const message: ChatMessage = {
    id: 1,
    senderId: 'participant-1',
    nickname: '토마토',
    content: '다들 화이팅',
    sentAt: '2026-01-01T00:00:00.000Z',
  };

  const chatEvents: {
    event: SseEventPayload;
    messageCalls: ChatMessage[][];
    historyCalls: ChatMessage[][][];
  }[] = [
    {
      event: { type: 'chat_message', data: message },
      messageCalls: [[message]],
      historyCalls: [],
    },
    {
      event: { type: 'chat_history', data: { messages: [message] } },
      messageCalls: [],
      historyCalls: [[[message]]],
    },
  ];

  it.each(chatEvents)(
    '$event.type 이벤트를 받으면 방 상태는 그대로 두고 맞는 콜백만 부른다',
    ({ event, messageCalls, historyCalls }) => {
      // given
      let callbacks: SseCallbacks | undefined;
      mockCreateRoomSseConnection.mockImplementation(
        (_roomId: string, given: SseCallbacks) => {
          callbacks = given;
          return { close: vi.fn() };
        },
      );
      const onRoomState = vi.fn();
      const onChatMessage = vi.fn();
      const onChatHistory = vi.fn();
      renderHook(() =>
        useRoomSSE('room-1', true, onRoomState, onChatMessage, onChatHistory),
      );

      // when
      callbacks?.onMessage(event);

      // then
      expect(onChatMessage.mock.calls).toEqual(messageCalls);
      expect(onChatHistory.mock.calls).toEqual(historyCalls);
      expect(onRoomState).not.toHaveBeenCalled();
    },
  );
});
