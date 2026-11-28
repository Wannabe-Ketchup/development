import { PayloadTooLargeException } from '@nestjs/common';
import { Attachment } from '../../../src/feedback/domain/attachment';
import { Attachments } from '../../../src/feedback/domain/attachments';

function restore(size: number): Attachment {
  return Attachment.restore({
    fileName: 'a.png',
    mimeType: 'image/png',
    path: '/tmp/file',
    size,
  });
}

describe('Attachments', () => {
  describe('of', () => {
    it('첨부 합계가 18,000,000바이트이면 접수할 수 있다', () => {
      // when
      const attachments = Attachments.of([
        restore(10_000_000),
        restore(8_000_000),
      ]);

      // then
      expect(attachments.totalBytes).toBe(18_000_000);
    });

    it('첨부 합계가 18,000,000바이트를 넘으면 접수할 수 없다', () => {
      // when & then
      expect(() =>
        Attachments.of([restore(10_000_000), restore(8_000_001)]),
      ).toThrow(PayloadTooLargeException);
    });

    it('첨부가 500개이면 접수할 수 있다', () => {
      // given
      const items = Array.from({ length: 500 }, () => restore(1));

      // when
      const attachments = Attachments.of(items);

      // then
      expect(attachments.toArray()).toHaveLength(500);
    });

    it('첨부가 500개를 넘으면 접수할 수 없다', () => {
      // given
      const items = Array.from({ length: 501 }, () => restore(1));

      // when & then
      expect(() => Attachments.of(items)).toThrow(PayloadTooLargeException);
    });
  });
});
