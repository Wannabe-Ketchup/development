// 보던 참여자가 아직 있으면 그대로, 나갔거나 처음이면 본인, 본인도 없으면 첫 번째
export function resolveViewedParticipantId(
  participantIds: readonly string[],
  viewedId: string | null,
  selfId: string | null,
): string | null {
  if (viewedId !== null && participantIds.includes(viewedId)) return viewedId;
  if (selfId !== null && participantIds.includes(selfId)) return selfId;
  return participantIds[0] ?? null;
}
