import { IsString } from 'class-validator';
import type { SubmitFeedbackRequest } from '@pomodoro/shared';

export class SubmitFeedbackDto implements SubmitFeedbackRequest {
  @IsString()
  content!: string;
}
