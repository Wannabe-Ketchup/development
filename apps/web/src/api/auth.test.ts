import { loginGuest } from './auth';

const GUEST_LOGIN_PATH = '/api/auth/login/guest';

describe('loginGuest', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('동시에 여러 번 호출해도 게스트 로그인 요청은 한 번만 보낸다', async () => {
    // given
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', fetchMock);

    // when
    await Promise.all([loginGuest(), loginGuest(), loginGuest()]);

    // then
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(GUEST_LOGIN_PATH, {
      method: 'POST',
    });
  });

  it('게스트 로그인이 실패한 뒤 다시 호출하면 로그인 요청을 다시 보낸다', async () => {
    // given
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: false })
      .mockResolvedValueOnce({ ok: true });
    vi.stubGlobal('fetch', fetchMock);
    await expect(loginGuest()).rejects.toThrow();

    // when
    await loginGuest();

    // then
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
