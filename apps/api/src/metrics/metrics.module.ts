import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { collectDefaultMetrics, Registry } from 'prom-client';
import { MetricsController } from './metrics.controller';
import { MetricsService } from './metrics.service';
import { MetricsMiddleware } from './metrics.middleware';

@Module({
  controllers: [MetricsController],
  providers: [
    {
      provide: Registry,
      useFactory: (): Registry => {
        const registry = new Registry();
        collectDefaultMetrics({ register: registry });
        return registry;
      },
    },
    MetricsService,
  ],
  exports: [Registry, MetricsService],
})
export class MetricsModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    // SSE는 연결이 끊길 때 응답이 끝나 응답시간을 왜곡하고, /metrics는 Prometheus 수집 요청이라 HTTP 메트릭에서 제외한다.
    // SSE 엔드포인트를 추가하면 여기에도 추가해야 한다.
    consumer
      .apply(MetricsMiddleware)
      .exclude(
        { path: 'metrics', method: RequestMethod.GET },
        { path: 'sse/pomodoro/:roomId', method: RequestMethod.GET },
      )
      .forRoutes('*');
  }
}
