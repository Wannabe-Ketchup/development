const TIME_DIGITS = 2;

// 보낸 시각(ISO 8601)을 보는 사람의 시간대로 'HH:MM'(24시간)으로 바꾼다
export function formatChatTime(sentAt: string): string {
  const date = new Date(sentAt);
  const hours = String(date.getHours()).padStart(TIME_DIGITS, '0');
  const minutes = String(date.getMinutes()).padStart(TIME_DIGITS, '0');
  return `${hours}:${minutes}`;
}
