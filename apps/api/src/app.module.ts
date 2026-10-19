import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PomodoroModule } from './pomodoro/pomodoro.module';
import { HealthModule } from './health/health.module';
import { MusicModule } from './music/music.module';
import { LoggerModule } from './common/logger.module';
import { HttpLoggerMiddleware } from './common/middleware/http-logger.middleware';
import { AlsModule } from './common/als.module';
import { AlsMiddleware } from './common/middleware/als.middleware';
import { AuthModule } from './auth/auth.module';
// import { APP_GUARD } from '@nestjs/core';
// import { SessionGuard } from './auth/guard/session.guard';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PomodoroModule,
    HealthModule,
    MusicModule,
    AlsModule,
    LoggerModule,
    AuthModule,
  ],
  providers: [
    // 프론트엔드 세션 연동이 완료된 후, 아래 주석을 해제하여 전역 가드를 활성화합니다.
    // 기존 오픈 API(health 등)에는 @Public() 데코레이터를 부착해야 합니다.
    // {
    //   provide: APP_GUARD,
    //   useClass: SessionGuard,
    // },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    // AlsMiddleware 다음 HttpLoggerMiddleware 를 실행함.
    consumer.apply(AlsMiddleware, HttpLoggerMiddleware).forRoutes('*');
  }
}
