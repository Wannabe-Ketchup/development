import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ChatMessage, SendChatMessageRequest } from '@pomodoro/shared';
import { sendChatMessage, SendChatMessageError } from './chat';

describe('sendChatMessage', () => {
  const request: SendChatMessageRequest = {
    clientMessageId: '00000000-0000-4000-8000-000000000001',
    content: '다들 화이팅',
  };

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('방의 채팅 주소로 내용과 clientMessageId를 보내고 저장된 메시지를 돌려준다', async () => {
    // given
    const message: ChatMessage = {
      id: 1,
      senderId: 'participant-1',
      nickname: '토마토',
      content: '다들 화이팅',
      sentAt: '2026-01-01T00:00:00.000Z',
    };
    const fetchMock = vi
      .fn()
      .mockResolvedValue(Response.json(message, { status: 201 }));
    vi.stubGlobal('fetch', fetchMock);

    // when
    const sent = await sendChatMessage('room-1', request);

    // then
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('/api/pomodoro/room/room-1/chat-message');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body as string)).toEqual(request);
    expect(sent).toEqual(message);
  });

  it.each([
    { status: 429, reason: 'rate-limited' },
    { status: 400, reason: 'unknown' },
    { status: 404, reason: 'unknown' },
    { status: 500, reason: 'unknown' },
  ])(
    '응답 status가 $status이면 실패 원인은 $reason이다',
    async ({ status, reason }) => {
      // given: nginx 오류처럼 본문이 JSON이 아니어도 status로만 나눈다
      const response = new Response('<html>error</html>', { status });
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response));

      // when
      const error = await sendChatMessage('room-1', request).catch(
        (e: unknown) => e,
      );

      // then
      expect(error).toBeInstanceOf(SendChatMessageError);
      expect((error as SendChatMessageError).reason).toBe(reason);
    },
  );

  it('네트워크 오류이면 실패 원인은 unknown이다', async () => {
    // given
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('fail')));

    // when
    const error = await sendChatMessage('room-1', request).catch(
      (e: unknown) => e,
    );

    // then
    expect((error as SendChatMessageError).reason).toBe('unknown');
  });

  it('10초 동안 응답이 없으면 요청을 멈추고 실패 원인은 unknown이다', async () => {
    // given: AbortSignal.timeout은 가짜 타이머로 흐르지 않아 직접 중단시킨다
    const controller = new AbortController();
    const timeout = vi
      .spyOn(AbortSignal, 'timeout')
      .mockReturnValue(controller.signal);
    vi.stubGlobal(
      'fetch',
      vi.fn(
        (_url: string, init: RequestInit) =>
          new Promise((_resolve, reject) => {
            init.signal?.addEventListener('abort', () =>
              reject(new DOMException('timeout', 'TimeoutError')),
            );
          }),
      ),
    );

    // when
    const sending = sendChatMessage('room-1', request).catch((e: unknown) => e);
    controller.abort();
    const error = await sending;

    // then
    expect(timeout).toHaveBeenCalledWith(10_000);
    expect((error as SendChatMessageError).reason).toBe('unknown');
  });
});
