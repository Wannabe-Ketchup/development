import { getRoomIdFromPathname } from './room-id';

type Route = 'home' | 'pomodoro' | 'not-found';

export function resolveRoute(pathname: string): Route {
  if (pathname === '/') return 'home';
  if (getRoomIdFromPathname(pathname) !== null) return 'pomodoro';
  return 'not-found';
}
