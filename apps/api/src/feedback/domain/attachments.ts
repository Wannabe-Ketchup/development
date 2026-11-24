import { PayloadTooLargeException } from '@nestjs/common';
import {
  FEEDBACK_ATTACHMENT_MAX_COUNT,
  FEEDBACK_ATTACHMENT_MAX_TOTAL_BYTES,
} from '@pomodoro/shared';
import { Attachment } from './attachment';

export class Attachments {
  private constructor(private readonly items: readonly Attachment[]) {}

  static of(items: Attachment[]): Attachments {
    if (items.length > FEEDBACK_ATTACHMENT_MAX_COUNT) {
      throw new PayloadTooLargeException('첨부 개수가 너무 많습니다.');
    }
    const attachments = new Attachments([...items]);
    if (attachments.totalBytes > FEEDBACK_ATTACHMENT_MAX_TOTAL_BYTES) {
      throw new PayloadTooLargeException('첨부 용량이 너무 큽니다.');
    }
    return attachments;
  }

  static restore(items: Attachment[]): Attachments {
    return new Attachments([...items]);
  }

  get totalBytes(): number {
    return this.items.reduce((sum, item) => sum + item.size, 0);
  }

  toArray(): readonly Attachment[] {
    return this.items;
  }
}
