import { Injectable } from '@nestjs/common';
import { Clock } from '../../common/clock/clock';
import { Feedback } from '../domain/feedback.entity';
import { FeedbackQuotaRepository } from '../repository/feedback-quota.repository';
import { FeedbackMailSender } from './feedback-mail-sender';
import { SubmitFeedbackCommand } from './submit-feedback.command';

@Injectable()
export class SubmitFeedbackService {
  constructor(
    private readonly clock: Clock,
    private readonly quotaRepository: FeedbackQuotaRepository,
    private readonly mailSender: FeedbackMailSender,
  ) {}

  async submitFeedback(command: SubmitFeedbackCommand): Promise<void> {
    const now = this.clock.now();
    const feedback = Feedback.create({ ...command, submittedAt: now });
    const quota = this.quotaRepository.get();
    quota.consume(feedback.attachments.totalBytes, now);
    this.quotaRepository.save(quota);
    await this.mailSender.send(feedback);
  }
}
