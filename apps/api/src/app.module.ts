import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { PomodoroModule } from './pomodoro/pomodoro.module';
import { HealthModule } from './health/health.module';
import { MusicModule } from './music/music.module';
import { LoggerModule } from './common/logger.module';
import { HttpLoggerMiddleware } from './common/middleware/http-logger.middleware';
import { AlsModule } from './common/als.module';
import { AlsMiddleware } from './common/middleware/als.middleware';
import { AuthModule } from './auth/auth.module';
import { MetricsModule } from './metrics/metrics.module';
import { APP_GUARD } from '@nestjs/core';
import { SessionGuard } from './auth/guard/session.guard';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    EventEmitterModule.forRoot(),
    PomodoroModule,
    HealthModule,
    MusicModule,
    AlsModule,
    LoggerModule,
    AuthModule,
    MetricsModule,
  ],
  providers: [
    // @Public()이 없는 모든 핸들러는 유효한 로그인 세션이 있어야 한다.
    { provide: APP_GUARD, useClass: SessionGuard },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    // AlsMiddleware 다음 HttpLoggerMiddleware 를 실행함.
    consumer.apply(AlsMiddleware, HttpLoggerMiddleware).forRoutes('*');
  }
}
