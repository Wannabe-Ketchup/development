import { Controller, Get } from '@nestjs/common';
import { MusicQueryService } from '../service/music-query.service';
import type { MusicResponse } from '@pomodoro/shared';

@Controller('music')
export class MusicController {
  constructor(private readonly musicService: MusicQueryService) {}

  @Get('/random')
  getMusic(): MusicResponse {
    const randomValue = Math.random();
    const url = this.musicService.getRandomUrl(randomValue);
    return { url };
  }
}
