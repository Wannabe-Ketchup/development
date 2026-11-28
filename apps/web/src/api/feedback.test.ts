import { afterEach, describe, expect, it, vi } from 'vitest';
import { submitFeedback, SubmitFeedbackError } from './feedback';

describe('submitFeedback', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it.each([
    { status: 400, reason: 'invalid' },
    { status: 413, reason: 'too-large' },
    { status: 429, reason: 'quota-exceeded' },
    { status: 503, reason: 'unavailable' },
    { status: 500, reason: 'unknown' },
  ])(
    '응답 status가 $status이면 실패 원인은 $reason이다',
    async ({ status, reason }) => {
      // given: nginx 413처럼 본문이 JSON이 아니어도 status로만 나눈다
      const response = new Response('<html>error</html>', { status });
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response));

      // when
      const error = await submitFeedback('내용', []).catch((e: unknown) => e);

      // then
      expect(error).toBeInstanceOf(SubmitFeedbackError);
      expect((error as SubmitFeedbackError).reason).toBe(reason);
    },
  );

  it('네트워크 오류이면 실패 원인은 unknown이다', async () => {
    // given
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('fail')));

    // when
    const error = await submitFeedback('내용', []).catch((e: unknown) => e);

    // then
    expect((error as SubmitFeedbackError).reason).toBe('unknown');
  });

  it('내용과 첨부를 FormData로 보내고 Content-Type은 지정하지 않는다', async () => {
    // given
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal('fetch', fetchMock);
    const file = new File(['a'], 'a.png');

    // when
    await submitFeedback('내용', [file]);

    // then
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const body = init.body as FormData;
    expect(url).toBe('/api/feedbacks');
    expect(body.get('content')).toBe('내용');
    expect(body.getAll('attachments')).toHaveLength(1);
    expect(init.headers).toBeUndefined();
  });
});
