const GUEST_LOGIN_PATH = '/api/auth/login/guest';

let pendingGuestLogin: Promise<void> | null = null;

// 동시에 여러 번 불려도 게스트 로그인 요청은 하나만 보낸다.
export function loginGuest(): Promise<void> {
  pendingGuestLogin ??= requestGuestLogin().finally(() => {
    pendingGuestLogin = null;
  });
  return pendingGuestLogin;
}

async function requestGuestLogin(): Promise<void> {
  const response = await fetch(GUEST_LOGIN_PATH, { method: 'POST' });
  if (!response.ok) {
    throw new Error('게스트 로그인에 실패했습니다.');
  }
}
