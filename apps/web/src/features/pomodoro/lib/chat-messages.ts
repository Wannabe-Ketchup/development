import type { ChatMessage } from '@pomodoro/shared';

// 같은 메시지가 chat_message, chat_history, 전송 응답으로 여러 번 올 수 있어 id로 합친다.
// 서버에서 지워진 오래된 메시지도 화면에 받은 것은 남긴다.
// 새 메시지가 없으면 받은 배열을 그대로 돌려줘 다시 그리지 않게 한다
export function mergeChatMessages(
  current: ChatMessage[],
  incoming: ChatMessage[],
): ChatMessage[] {
  const messageById = new Map(current.map((message) => [message.id, message]));
  for (const message of incoming) messageById.set(message.id, message);

  const hasNewMessage = messageById.size > current.length;
  if (!hasNewMessage) return current;
  return [...messageById.values()].sort((a, b) => a.id - b.id);
}

// 메시지가 없으면 0. id는 1부터라 어떤 메시지보다 작다
export function getLastMessageId(messages: ChatMessage[]): number {
  return messages.at(-1)?.id ?? 0;
}

// 내가 보낸 메시지는 다른 탭에서 보냈어도 안 읽은 메시지로 보지 않는다
export function hasUnreadMessage(
  messages: ChatMessage[],
  lastReadId: number,
  selfParticipantId: string,
): boolean {
  return messages.some(
    (message) =>
      message.id > lastReadId && message.senderId !== selfParticipantId,
  );
}
