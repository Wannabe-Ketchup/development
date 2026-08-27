import { Controller } from '@nestjs/common';
import { TimerService } from '../service/timer.service';

@Controller('pomodoro')
export class PomodoroController {
  constructor(private readonly timerService: TimerService) {}
}
