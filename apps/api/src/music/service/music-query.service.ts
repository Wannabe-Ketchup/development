import { Injectable } from '@nestjs/common';
import { MusicRepository } from '../repository/music.repository';

@Injectable()
export class MusicQueryService {
  constructor(private readonly musicRepository: MusicRepository) {}

  // 전체 음악 목록 중 무작위로 하나의 URL을 선택하여 반환
  getRandomUrl(randomValue: number): string {
    const urls = this.musicRepository.findAll();
    const index = Math.floor(randomValue * urls.length);
    return urls[index];
  }
}
