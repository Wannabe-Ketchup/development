import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PomodoroModule } from './pomodoro/pomodoro.module';
import { HealthModule } from './health/health.module';
import { MusicModule } from './music/music.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PomodoroModule,
    HealthModule,
    MusicModule,
  ],
})
export class AppModule {}
