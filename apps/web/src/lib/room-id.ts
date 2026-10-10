// roomId 파싱 규칙
export function getRoomIdFromSearch(search: string): string | null {
  return new URLSearchParams(search).get('roomId');
}
// URL(search 문자열 -> 지금은 window.location.search에서)을 어디서 가져오는지
export function useRoomId(): string | null {
  return getRoomIdFromSearch(window.location.search);
}
// 방 페이지 주소를 만드는 규칙(파싱 규칙과 짝)
export function goToRoom(roomId: string): void {
  window.location.href = `/pomodoro?roomId=${encodeURIComponent(roomId)}`;
}
