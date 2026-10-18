import type { Mock } from 'vitest';
import { api } from './http';
import { loginGuest } from './auth';

vi.mock('./auth');

const mockLoginGuest = loginGuest as unknown as Mock;

describe('api', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('401을 받으면 게스트 로그인 후 같은 요청을 한 번 다시 보낸다', async () => {
    // given
    const unauthorized = { status: 401 };
    const ok = { status: 200 };
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(unauthorized)
      .mockResolvedValueOnce(ok);
    vi.stubGlobal('fetch', fetchMock);
    mockLoginGuest.mockResolvedValue(undefined);
    const init = { method: 'PATCH', body: '{}' };

    // when
    const response = await api('/api/target', init);

    // then
    expect(response).toBe(ok);
    expect(mockLoginGuest).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock).toHaveBeenNthCalledWith(2, '/api/target', init);
  });

  it('다시 보낸 요청도 401이면 더 로그인하지 않고 그 응답을 반환한다', async () => {
    // given
    const unauthorized = { status: 401 };
    const fetchMock = vi.fn().mockResolvedValue(unauthorized);
    vi.stubGlobal('fetch', fetchMock);
    mockLoginGuest.mockResolvedValue(undefined);

    // when
    const response = await api('/api/target');

    // then
    expect(response).toBe(unauthorized);
    expect(mockLoginGuest).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
