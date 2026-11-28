import { BadRequestException } from '@nestjs/common';
import { FEEDBACK_CONTENT_MAX_LENGTH } from '@pomodoro/shared';

export class FeedbackContent {
  private constructor(readonly value: string) {}

  static restore(value: string): FeedbackContent {
    return new FeedbackContent(value);
  }

  static of(raw: string): FeedbackContent {
    if (raw.trim().length === 0) {
      throw new BadRequestException('내용을 입력해 주세요.');
    }
    if (raw.length > FEEDBACK_CONTENT_MAX_LENGTH) {
      throw new BadRequestException('내용이 너무 깁니다.');
    }
    return new FeedbackContent(raw);
  }
}
