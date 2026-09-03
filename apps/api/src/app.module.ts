import { Module } from '@nestjs/common';
import { PomodoroModule } from './pomodoro/pomodoro.module';

@Module({
  imports: [PomodoroModule],
})
export class AppModule {}
