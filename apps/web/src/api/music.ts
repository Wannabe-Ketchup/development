import type { MusicResponse } from '@pomodoro/shared';

export async function fetchRandomMusicUrl(): Promise<string> {
  const response = await fetch('/api/music/random');
  if (!response.ok) {
    throw new Error('서버로부터 음악을 불러오는데 실패했습니다.');
  }
  const data: MusicResponse = await response.json();
  return data.url;
}
