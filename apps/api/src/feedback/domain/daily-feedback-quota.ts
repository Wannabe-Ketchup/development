import { HttpException, HttpStatus } from '@nestjs/common';

export const FEEDBACK_DAILY_MAX_COUNT = 100;
export const FEEDBACK_DAILY_MAX_ATTACHMENT_BYTES = 500_000_000;

export const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

function kstDay(now: Date): string {
  return new Date(now.getTime() + KST_OFFSET_MS).toISOString().slice(0, 10);
}

export class DailyFeedbackQuota {
  private constructor(
    private day: string,
    private count: number,
    private attachmentBytes: number,
  ) {}

  static empty(): DailyFeedbackQuota {
    return new DailyFeedbackQuota('', 0, 0);
  }

  static restore(props: {
    day: string;
    count: number;
    attachmentBytes: number;
  }): DailyFeedbackQuota {
    return new DailyFeedbackQuota(
      props.day,
      props.count,
      props.attachmentBytes,
    );
  }

  get snapshot(): { day: string; count: number; attachmentBytes: number } {
    return {
      day: this.day,
      count: this.count,
      attachmentBytes: this.attachmentBytes,
    };
  }

  consume(attachmentBytes: number, now: Date): void {
    const today = kstDay(now);
    if (this.day !== today) {
      this.day = today;
      this.count = 0;
      this.attachmentBytes = 0;
    }
    if (
      this.count + 1 > FEEDBACK_DAILY_MAX_COUNT ||
      this.attachmentBytes + attachmentBytes >
        FEEDBACK_DAILY_MAX_ATTACHMENT_BYTES
    ) {
      throw new HttpException(
        '오늘은 피드백을 더 받을 수 없습니다.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    this.count += 1;
    this.attachmentBytes += attachmentBytes;
  }
}
