import { HttpException } from '@nestjs/common';
import {
  DailyFeedbackQuota,
  FEEDBACK_DAILY_MAX_ATTACHMENT_BYTES,
  FEEDBACK_DAILY_MAX_COUNT,
} from '../../../src/feedback/domain/daily-feedback-quota';

const DAY = '2026-11-23';
const NOON_KST = new Date('2026-11-23T03:00:00.000Z');

describe('DailyFeedbackQuota', () => {
  describe('consume', () => {
    it.each([
      {
        name: `${FEEDBACK_DAILY_MAX_COUNT}건째`,
        count: FEEDBACK_DAILY_MAX_COUNT - 1,
        attachmentBytes: 0,
        bytes: 0,
      },
      {
        name: `첨부 합계 ${FEEDBACK_DAILY_MAX_ATTACHMENT_BYTES}바이트째`,
        count: 0,
        attachmentBytes: FEEDBACK_DAILY_MAX_ATTACHMENT_BYTES - 10,
        bytes: 10,
      },
    ])('오늘 접수가 $name이면 접수할 수 있다', (given) => {
      // given
      const quota = DailyFeedbackQuota.restore({
        day: DAY,
        count: given.count,
        attachmentBytes: given.attachmentBytes,
      });

      // when
      quota.consume(given.bytes, NOON_KST);

      // then
      expect(quota.snapshot.count).toBe(given.count + 1);
    });

    it.each([
      {
        name: `${FEEDBACK_DAILY_MAX_COUNT + 1}건째`,
        count: FEEDBACK_DAILY_MAX_COUNT,
        attachmentBytes: 0,
        bytes: 0,
      },
      {
        name: `첨부 합계가 ${FEEDBACK_DAILY_MAX_ATTACHMENT_BYTES}바이트를 넘는`,
        count: 0,
        attachmentBytes: FEEDBACK_DAILY_MAX_ATTACHMENT_BYTES - 10,
        bytes: 11,
      },
    ])('오늘 접수가 $name 경우에는 접수할 수 없다', (given) => {
      // given
      const quota = DailyFeedbackQuota.restore({
        day: DAY,
        count: given.count,
        attachmentBytes: given.attachmentBytes,
      });

      // when & then
      expect(() => quota.consume(given.bytes, NOON_KST)).toThrow(HttpException);
    });

    it('상한에 닿은 날의 KST 23:59:59에는 접수할 수 없다', () => {
      // given
      const quota = DailyFeedbackQuota.restore({
        day: DAY,
        count: FEEDBACK_DAILY_MAX_COUNT,
        attachmentBytes: 0,
      });

      // when & then
      expect(() =>
        quota.consume(0, new Date('2026-11-23T14:59:59.000Z')),
      ).toThrow(HttpException);
    });

    it('상한에 닿아도 KST 날짜가 바뀌면 다시 접수할 수 있다', () => {
      // given
      const quota = DailyFeedbackQuota.restore({
        day: DAY,
        count: FEEDBACK_DAILY_MAX_COUNT,
        attachmentBytes: FEEDBACK_DAILY_MAX_ATTACHMENT_BYTES,
      });

      // when
      quota.consume(5, new Date('2026-11-23T15:00:00.000Z'));

      // then
      expect(quota.snapshot).toEqual({
        day: '2026-11-24',
        count: 1,
        attachmentBytes: 5,
      });
    });
  });
});
