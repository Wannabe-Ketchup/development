import { Module } from '@nestjs/common';
import { PomodoroController } from './controller/pomodoro.controller';
import { TimerService } from './service/timer.service';

@Module({
  controllers: [PomodoroController],
  providers: [TimerService],
})
export class PomodoroModule {}
