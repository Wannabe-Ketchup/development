import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ListObjectsV2Command, S3Client } from '@aws-sdk/client-s3';
import { MusicRepository } from '../repository/music.repository';

function extractMusicFiles(contents?: { Key?: string }[]): string[] {
  return (contents ?? [])
    .map((object) => object.Key)
    .filter((key): key is string => key !== undefined && !key.endsWith('/'));
}

export function buildMusicUrls(
  contents: { Key?: string }[] | undefined,
  cdnDomain: string,
): string[] {
  const musicFiles = extractMusicFiles(contents);

  return musicFiles.map((musicFile) => {
    const fileName = musicFile.split('/').pop() || musicFile;
    return `${cdnDomain}/${fileName}`;
  });
}

@Injectable()
export class LoadS3MusicService implements OnApplicationBootstrap {
  private readonly logger = new Logger(LoadS3MusicService.name);

  constructor(
    private readonly s3Client: S3Client,
    private readonly configService: ConfigService,
    private readonly musicRepository: MusicRepository,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    const urls = await this.loadUrls();
    this.musicRepository.save(urls);
  }

  private async loadUrls(): Promise<string[]> {
    this.logger.log('음악 목록 로딩 시작');

    const bucket = this.configService.getOrThrow<string>('AWS_S3_BUCKET');
    const prefix = this.configService.getOrThrow<string>('AWS_S3_PREFIX');
    const cdnDomain = this.configService.getOrThrow<string>('CDN_DOMAIN');

    const response = await this.s3Client.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: prefix,
      }),
    );

    const urls = buildMusicUrls(response.Contents, cdnDomain);

    if (urls.length === 0) {
      this.logger.warn('S3에 음악이 존재하지 않습니다.');
      return [];
    }

    urls.forEach((url) => {
      const fileName = url.split('/').pop() ?? url;
      this.logger.log(`로드된 음악: ${fileName}`);
    });

    this.logger.log('음악 목록 로드 완료');

    return urls;
  }
}
