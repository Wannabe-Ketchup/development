import { Test } from '@nestjs/testing';
import { Clock } from '../../../src/common/clock/clock';
import { Feedback } from '../../../src/feedback/domain/feedback.entity';
import { FeedbackQuotaRepository } from '../../../src/feedback/repository/feedback-quota.repository';
import { InMemoryFeedbackQuotaRepository } from '../../../src/feedback/repository/in-memory.feedback-quota.repository';
import { FeedbackMailSender } from '../../../src/feedback/service/feedback-mail-sender';
import { SubmitFeedbackService } from '../../../src/feedback/service/submit-feedback.service';
import { PNG_HEADER } from '../attachment-headers';

const NOW = new Date('2026-11-23T03:00:00.000Z');

class FixedClock extends Clock {
  now(): Date {
    return NOW;
  }
}

class RecordingMailSender extends FeedbackMailSender {
  readonly sent: Feedback[] = [];

  send(feedback: Feedback): Promise<void> {
    this.sent.push(feedback);
    return Promise.resolve();
  }
}

async function createModule() {
  const moduleRef = await Test.createTestingModule({
    providers: [
      SubmitFeedbackService,
      { provide: Clock, useClass: FixedClock },
      {
        provide: FeedbackQuotaRepository,
        useClass: InMemoryFeedbackQuotaRepository,
      },
      { provide: FeedbackMailSender, useClass: RecordingMailSender },
    ],
  }).compile();
  return {
    service: moduleRef.get(SubmitFeedbackService),
    quotaRepository: moduleRef.get(FeedbackQuotaRepository),
    mailSender: moduleRef.get<RecordingMailSender>(FeedbackMailSender),
  };
}

function createCommand() {
  return {
    content: '타이머가 좋아요',
    attachments: [
      {
        originalName: '화면.png',
        header: PNG_HEADER,
        path: '/tmp/upload-1',
        size: 1_000,
      },
    ],
    ip: '203.0.113.7',
    participantId: 'participant-1',
    userAgent: 'test-agent',
  };
}

describe('SubmitFeedbackService', () => {
  describe('submitFeedback', () => {
    it('피드백을 보내면 접수 정보와 내용이 판별된 첨부와 함께 메일로 발송된다', async () => {
      // given
      const { service, mailSender } = await createModule();
      const command = createCommand();

      // when
      await service.submitFeedback(command);

      // then
      const [feedback] = mailSender.sent;
      expect(feedback.content.value).toBe(command.content);
      expect(feedback.ip).toBe(command.ip);
      expect(feedback.participantId).toBe(command.participantId);
      expect(feedback.userAgent).toBe(command.userAgent);
      expect(feedback.submittedAt).toBe(NOW);
      expect(feedback.attachments.toArray()).toMatchObject([
        { fileName: '화면.png', mimeType: 'image/png', path: '/tmp/upload-1' },
      ]);
    });

    it('피드백을 보내면 오늘 접수 건수와 첨부 용량이 저장소에 남는다', async () => {
      // given
      const { service, quotaRepository } = await createModule();
      const command = createCommand();

      // when
      await service.submitFeedback(command);

      // then
      expect(quotaRepository.get().snapshot).toEqual({
        day: '2026-11-23',
        count: 1,
        attachmentBytes: 1_000,
      });
    });
  });
});
