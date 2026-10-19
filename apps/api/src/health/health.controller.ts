import { Public } from '../auth/decorator/public.decorator';
import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Public()
  @Get()
  check() {
    return { status: 'ok' };
  }
}
