import { BadRequestException } from '@nestjs/common';
import { FeedbackContent } from '../../../src/feedback/domain/feedback-content';

describe('FeedbackContent', () => {
  describe('of', () => {
    it.each([
      { name: '빈 문자열', raw: '' },
      { name: '스페이스만 있는 내용', raw: '   ' },
      { name: '줄바꿈과 탭만 있는 내용', raw: '\n\t\n' },
    ])('$name은 접수할 수 없다', ({ raw }) => {
      // when & then
      expect(() => FeedbackContent.of(raw)).toThrow(BadRequestException);
    });

    it('내용이 60,000자이면 입력 그대로 접수할 수 있다', () => {
      // given
      const raw = ` ${'가'.repeat(59_999)}`;

      // when
      const content = FeedbackContent.of(raw);

      // then
      expect(content.value).toBe(raw);
    });

    it('내용이 60,000자를 넘으면 접수할 수 없다', () => {
      // given
      const raw = '가'.repeat(60_001);

      // when & then
      expect(() => FeedbackContent.of(raw)).toThrow(BadRequestException);
    });
  });
});
