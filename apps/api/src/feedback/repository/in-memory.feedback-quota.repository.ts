import { Injectable } from '@nestjs/common';
import { DailyFeedbackQuota } from '../domain/daily-feedback-quota';
import { FeedbackQuotaRepository } from './feedback-quota.repository';

@Injectable()
export class InMemoryFeedbackQuotaRepository extends FeedbackQuotaRepository {
  private quota = DailyFeedbackQuota.empty();

  get(): DailyFeedbackQuota {
    return this.quota;
  }

  save(quota: DailyFeedbackQuota): void {
    this.quota = quota;
  }
}
