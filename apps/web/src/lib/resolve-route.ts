import { POMODORO_PATH } from './room-id';

type Route = 'home' | 'pomodoro' | 'not-found';

export function resolveRoute(pathname: string, search: string): Route {
  const roomIds = new URLSearchParams(search).getAll('roomId');
  const hasNoRoomId = roomIds.length === 0;
  const hasSingleRoomId = roomIds.length === 1 && roomIds[0] !== '';

  if (pathname === '/' && hasNoRoomId) return 'home';
  if (pathname === POMODORO_PATH && hasSingleRoomId) return 'pomodoro';
  return 'not-found';
}
