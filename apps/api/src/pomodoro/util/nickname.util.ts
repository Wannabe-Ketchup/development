const NICKNAME_ADJECTIVES = ['졸린', '배고픈', '느긋한', '즐거운'];

export function generateRandomNickname(): string {
  const adjective =
    NICKNAME_ADJECTIVES[Math.floor(Math.random() * NICKNAME_ADJECTIVES.length)];

  return `${adjective}토마토`;
}
