import { Module } from '@nestjs/common';
import { PomodoroModule } from './pomodoro/pomodoro.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [PomodoroModule, HealthModule],
})
export class AppModule {}
