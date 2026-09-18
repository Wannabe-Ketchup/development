import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { MusicQueryService } from './music-query.service';
import { MusicRepository } from '../repository/music.repository';
import { InMemoryMusicRepository } from '../repository/in-memory.music.repository';

describe('MusicQueryService (Integration)', () => {
  let musicQueryService: MusicQueryService;
  let musicRepository: MusicRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MusicQueryService,
        {
          provide: MusicRepository,
          useClass: InMemoryMusicRepository,
        },
      ],
    }).compile();

    musicQueryService = module.get<MusicQueryService>(MusicQueryService);
    musicRepository = module.get<MusicRepository>(MusicRepository);
  });

  describe('getRandomUrl', () => {
    it('randomValue가 0.5면 중앙에 위치한 음악 URL을 반환한다.', () => {
      // given
      const urls = ['url1', 'url2', 'url3', 'url4', 'url5'];
      musicRepository.save(urls);

      const randomValue = 0.5;
      const expectedUrl = urls[2];

      // when
      const result = musicQueryService.getRandomUrl(randomValue);

      // then
      expect(result).toBe(expectedUrl);
    });

    it('randomValue가 0이면 첫 번째 URL을 반환한다.', () => {
      // given
      const urls = ['url1', 'url2', 'url3'];
      musicRepository.save(urls);

      const randomValue = 0;
      const expectedUrl = urls[0];

      // when
      const result = musicQueryService.getRandomUrl(randomValue);

      // then
      expect(result).toBe(expectedUrl);
    });

    it('randomValue가 1에 가까우면 마지막 URL을 반환한다.', () => {
      // given
      const urls = ['url1', 'url2', 'url3'];
      musicRepository.save(urls);

      const randomValue = 0.99;
      const expectedUrl = urls[2];

      // when
      const result = musicQueryService.getRandomUrl(randomValue);

      // then
      expect(result).toBe(expectedUrl);
    });

    it('저장된 음악이 없으면 NotFoundException을 던진다.', () => {
      // given
      const emptyUrls: string[] = [];
      musicRepository.save(emptyUrls);
      const randomValue = 0.5;

      // when & then
      expect(() => musicQueryService.getRandomUrl(randomValue)).toThrow(
        NotFoundException,
      );
    });
  });
});
