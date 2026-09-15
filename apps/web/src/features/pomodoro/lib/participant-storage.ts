const storageKey = (roomId: string) => `pomodoro:${roomId}:participantId`;

export function saveParticipantId(roomId: string, participantId: string): void {
  localStorage.setItem(storageKey(roomId), participantId);
}

export function getParticipantId(roomId: string): string | null {
  return localStorage.getItem(storageKey(roomId));
}
