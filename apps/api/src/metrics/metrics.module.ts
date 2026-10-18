import { Module } from '@nestjs/common';
import { collectDefaultMetrics, Registry } from 'prom-client';
import { MetricsController } from './metrics.controller';

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
  ],
  exports: [Registry],
})
export class MetricsModule {}
