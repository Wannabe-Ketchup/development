import { Module } from '@nestjs/common';
import { MusicController } from './controller/music.controller';
import { MusicQueryService } from './service/music-query.service';
import { MusicRepository } from './repository/music.repository';
import { InMemoryMusicRepository } from './repository/in-memory.music.repository';
import { S3ClientProvider } from './config/s3-client.provider';
import { LoadS3MusicService } from './service/load-s3-music.service';

@Module({
  controllers: [MusicController],
  providers: [
    S3ClientProvider,
    LoadS3MusicService,
    MusicQueryService,
    { provide: MusicRepository, useClass: InMemoryMusicRepository },
  ],
})
export class MusicModule {}
