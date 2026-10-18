import { Controller, Get, Header } from '@nestjs/common';
import { Registry } from 'prom-client';
import { Public } from '../auth/decorator/public.decorator';

@Controller('metrics')
export class MetricsController {
  constructor(private readonly registry: Registry) {}

  @Public()
  @Get()
  @Header('Content-Type', Registry.PROMETHEUS_CONTENT_TYPE)
  getMetrics(): Promise<string> {
    return this.registry.metrics();
  }
}
