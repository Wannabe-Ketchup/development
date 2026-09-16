import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { MusicRepository } from '../repository/music.repository';

@Injectable()
export class LoadS3MusicService implements OnApplicationBootstrap {
  private readonly logger = new Logger(LoadS3MusicService.name);

  constructor(
    private readonly s3Client: S3Client,
    private readonly configService: ConfigService,
    private readonly musicRepository: MusicRepository,
  ) {}

  // Nest.js 시작 과정에서 모듈 초기화 후에 실행
  async onApplicationBootstrap(): Promise<void> {
    const urls = await this.loadUrls();
    this.musicRepository.save(urls);
  }

  // S3 버킷에서 음악 파일 목록을 조회하여 CDN URL 배열로 반환
  private async loadUrls(): Promise<string[]> {
    this.logger.log('음악 목록 로딩 시작');

    const bucket = this.configService.getOrThrow<string>('AWS_S3_BUCKET');
    const prefix = this.configService.getOrThrow<string>('AWS_S3_PREFIX');
    const cdnDomain = this.configService.getOrThrow<string>('CDN_DOMAIN');

    const response = await this.s3Client.send(
      new ListObjectsV2Command({ Bucket: bucket, Prefix: prefix }),
    );

    const musicFiles = this.extractMusicFiles(response.Contents);

    if (musicFiles.length === 0) {
      this.logger.warn('S3에 음악이 존재하지 않습니다.');
      return [];
    }

    const urls = musicFiles.map((musicFile) => {
      const fileName = musicFile.split('/').pop() || musicFile;
      this.logger.log(`로드된 음악: ${fileName}`);
      return `${cdnDomain}/${fileName}`;
    });
    this.logger.log('음악 목록 로드 완료');

    return urls;
  }

  private extractMusicFiles(contents?: { Key?: string }[]): string[] {
    // AWS S3에선 파일명을 key로 부름
    return (contents ?? [])
      .map((obj) => obj.Key)
      .filter(
        (musicFile): musicFile is string =>
          musicFile !== undefined && !musicFile.endsWith('/'),
      );
  }
}
