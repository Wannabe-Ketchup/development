export const POMODORO_PATH = '/pomodoro';
const ROOM_PATH_PATTERN = new RegExp(`^${POMODORO_PATH}/([^/]+)/*$`);

// roomId 파싱 규칙
export function getRoomIdFromPathname(pathname: string): string | null {
  const match = ROOM_PATH_PATTERN.exec(pathname);
  if (!match) return null;
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return null;
  }
}
// URL(pathname)을 어디서 가져오는지
export function useRoomId(): string | null {
  return getRoomIdFromPathname(window.location.pathname);
}
// 방 페이지 주소를 만드는 규칙(파싱 규칙과 짝)
export function goToRoom(roomId: string): void {
  window.location.href = `${POMODORO_PATH}/${encodeURIComponent(roomId)}`;
}
