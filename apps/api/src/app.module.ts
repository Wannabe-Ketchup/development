import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PomodoroModule } from './pomodoro/pomodoro.module';
import { HealthModule } from './health/health.module';
import { LoggerModule } from './common/logger/logger.module';
import { MusicModule } from './music/music.module';
import { HttpLoggerMiddleware } from './common/middleware/HttpLogger.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PomodoroModule,
    HealthModule,
    MusicModule,
    LoggerModule,
  ],
})
export class AppModule implements NestModule {
  // 모든 라우트에 HttpLoggerMiddleware 적용
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(HttpLoggerMiddleware).forRoutes('*');
  }
}
