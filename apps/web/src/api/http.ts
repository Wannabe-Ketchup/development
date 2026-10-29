import { loginGuest } from './auth';

const UNAUTHORIZED_STATUS = 401;

// 401을 받으면 게스트 세션을 발급받고 원 요청을 한 번만 다시 보낸다.
export async function api(
  input: string,
  init?: RequestInit,
): Promise<Response> {
  const response = await fetch(input, init);
  if (response.status !== UNAUTHORIZED_STATUS) {
    return response;
  }
  await loginGuest();
  return fetch(input, init);
}
