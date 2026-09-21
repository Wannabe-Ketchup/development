import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PomodoroModule } from './pomodoro/pomodoro.module';
import { HealthModule } from './health/health.module';
import { LoggerModule } from './common/logger/logger.module';
import { MusicModule } from './music/music.module';
import { LoggerModule } from './common/logger.module';
import { HttpLoggerMiddleware } from './common/middleware/http-logger.middleware';
import { AlsModule } from './common/als.module';
import { AlsMiddleware } from './common/middleware/als.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PomodoroModule,
    HealthModule,
    MusicModule,
    AlsModule,
    LoggerModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    // AlsMiddleware 다음 HttpLoggerMiddleware 를 실행함.
    consumer.apply(AlsMiddleware, HttpLoggerMiddleware).forRoutes('*');
  }
}
