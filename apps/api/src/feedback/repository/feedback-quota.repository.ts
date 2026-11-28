import { DailyFeedbackQuota } from '../domain/daily-feedback-quota';

export abstract class FeedbackQuotaRepository {
  abstract get(): DailyFeedbackQuota;
  abstract save(quota: DailyFeedbackQuota): void;
}
