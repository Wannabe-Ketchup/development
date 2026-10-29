import { Injectable } from '@nestjs/common';
import { MusicRepository } from './music.repository';

@Injectable()
export class InMemoryMusicRepository extends MusicRepository {
  private urls: string[] = [];

  save(urls: string[]): void {
    this.urls = urls;
  }

  findAll(): string[] {
    return this.urls;
  }
}
