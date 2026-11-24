import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import type { ChatMessage } from '@pomodoro/shared';
import { sendChatMessage, SendChatMessageError } from '@/api/chat';
import { useChatMessageForm } from './useChatMessageForm';

vi.mock('@/api/chat', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/api/chat')>()),
  sendChatMessage: vi.fn(),
}));

const mockSendChatMessage = vi.mocked(sendChatMessage);

const message: ChatMessage = {
  id: 1,
  senderId: 'participant-1',
  nickname: '토마토',
  content: '다들 화이팅',
  sentAt: '2026-01-01T00:00:00.000Z',
};

function renderForm() {
  const onSent = vi.fn();
  const { result } = renderHook(() =>
    useChatMessageForm({ roomId: 'room-1', onSent }),
  );
  return { result, onSent };
}

function getSentClientMessageIds(): string[] {
  return mockSendChatMessage.mock.calls.map(
    ([, request]) => request.clientMessageId,
  );
}

describe('useChatMessageForm', () => {
  beforeEach(() => {
    mockSendChatMessage.mockReset();
  });

  it('보내면 저장된 메시지를 넘기고 입력을 비운다', async () => {
    // given
    mockSendChatMessage.mockResolvedValue(message);
    const { result, onSent } = renderForm();
    act(() => result.current.changeDraft('다들 화이팅'));

    // when
    await act(() => result.current.send());

    // then
    expect(mockSendChatMessage).toHaveBeenCalledWith('room-1', {
      clientMessageId: expect.any(String),
      content: '다들 화이팅',
    });
    expect(onSent).toHaveBeenCalledWith(message);
    expect(result.current.draft).toBe('');
    expect(result.current.state).toEqual({ status: 'idle' });
  });

  it.each(['', '   '])('입력이 "%s"이면 보내지 않는다', async (draft) => {
    // given
    const { result } = renderForm();
    act(() => result.current.changeDraft(draft));

    // when
    await act(() => result.current.send());

    // then
    expect(result.current.canSend).toBe(false);
    expect(mockSendChatMessage).not.toHaveBeenCalled();
  });

  it.each([
    { error: new SendChatMessageError('rate-limited'), reason: 'rate-limited' },
    { error: new Error('응답 본문이 깨짐'), reason: 'unknown' },
  ])(
    '보내지 못하면 입력을 그대로 두고 원인 $reason을 알린다',
    async ({ error, reason }) => {
      // given
      mockSendChatMessage.mockRejectedValue(error);
      const { result, onSent } = renderForm();
      act(() => result.current.changeDraft('다들 화이팅'));

      // when
      await act(() => result.current.send());

      // then
      expect(result.current.draft).toBe('다들 화이팅');
      expect(result.current.state).toEqual({ status: 'failed', reason });
      expect(result.current.canSend).toBe(true);
      expect(onSent).not.toHaveBeenCalled();
    },
  );

  it('보내지 못한 내용을 그대로 다시 보내면 같은 clientMessageId를 쓴다', async () => {
    // given
    mockSendChatMessage.mockRejectedValueOnce(
      new SendChatMessageError('unknown'),
    );
    mockSendChatMessage.mockResolvedValueOnce(message);
    const { result } = renderForm();
    act(() => result.current.changeDraft('다들 화이팅'));
    await act(() => result.current.send());

    // when
    await act(() => result.current.send());

    // then
    const [firstId, secondId] = getSentClientMessageIds();
    expect(secondId).toBe(firstId);
  });

  it('보내지 못한 내용을 고쳐서 보내면 새 clientMessageId를 쓰고 안내를 지운다', async () => {
    // given
    mockSendChatMessage.mockRejectedValueOnce(
      new SendChatMessageError('unknown'),
    );
    mockSendChatMessage.mockResolvedValueOnce(message);
    const { result } = renderForm();
    act(() => result.current.changeDraft('다들 화이팅'));
    await act(() => result.current.send());

    // when
    act(() => result.current.changeDraft('다들 화이팅!'));
    const stateAfterChange = result.current.state;
    await act(() => result.current.send());

    // then
    const [firstId, secondId] = getSentClientMessageIds();
    expect(stateAfterChange).toEqual({ status: 'idle' });
    expect(secondId).not.toBe(firstId);
  });

  it('보낸 뒤 같은 내용을 다시 입력해 보내면 새 clientMessageId를 쓴다', async () => {
    // given
    mockSendChatMessage.mockResolvedValue(message);
    const { result } = renderForm();
    act(() => result.current.changeDraft('ㅋㅋ'));
    await act(() => result.current.send());

    // when
    act(() => result.current.changeDraft('ㅋㅋ'));
    await act(() => result.current.send());

    // then
    const [firstId, secondId] = getSentClientMessageIds();
    expect(secondId).not.toBe(firstId);
  });

  it('보내는 중에는 다시 보내지 않고 입력도 바꾸지 않는다', async () => {
    // given
    let resolveSend: (sent: ChatMessage) => void = () => {};
    mockSendChatMessage.mockReturnValue(
      new Promise((resolve) => {
        resolveSend = resolve;
      }),
    );
    const { result } = renderForm();
    act(() => result.current.changeDraft('다들 화이팅'));

    // when: 첫 전송이 끝나기 전에 같은 틱에서 한 번 더 보내고 입력도 바꾼다
    let sending: Promise<void[]> = Promise.resolve([]);
    act(() => {
      sending = Promise.all([result.current.send(), result.current.send()]);
      result.current.changeDraft('다른 내용');
    });

    // then
    expect(result.current.state).toEqual({ status: 'sending' });
    expect(result.current.canSend).toBe(false);
    expect(result.current.draft).toBe('다들 화이팅');
    expect(mockSendChatMessage).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveSend(message);
      await sending;
    });
    expect(result.current.draft).toBe('');
  });
});
