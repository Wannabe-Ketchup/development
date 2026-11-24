import { BadRequestException } from '@nestjs/common';
import { Attachment } from '../../../src/feedback/domain/attachment';
import { EXE_HEADER, JPEG_HEADER, PNG_HEADER } from '../attachment-headers';

describe('Attachment', () => {
  describe('of', () => {
    it.each([
      {
        name: '한글 이름은 그대로 두고',
        originalName: '결제화면_오류.png',
        header: PNG_HEADER,
        expected: '결제화면_오류.png',
      },
      {
        name: '방향 제어 문자와 가짜 확장자는 지우고',
        originalName: '사진‮gnp.exe',
        header: PNG_HEADER,
        expected: '사진gnp.png',
      },
      {
        name: '경로 문자는 지우고',
        originalName: '../etc\\passwd.png',
        header: PNG_HEADER,
        expected: '..etcpasswd.png',
      },
      {
        name: '내용이 JPEG이면 확장자를 .jpg로 바꾸고',
        originalName: 'photo.png',
        header: JPEG_HEADER,
        expected: 'photo.jpg',
      },
      {
        name: '지우고 나서 이름이 비면 순번 이름을 붙이고',
        originalName: '​.png',
        header: PNG_HEADER,
        expected: 'attachment-1.png',
      },
    ])(
      '첨부 이름은 원본 이름에서 보이지 않는 문자와 경로 문자를 지우고 판별한 확장자를 붙인다: $name',
      ({ originalName, header, expected }) => {
        // when
        const attachment = Attachment.of({
          order: 1,
          originalName,
          header,
          path: '/tmp/file',
          size: 10,
        });

        // then
        expect(attachment.fileName).toBe(expected);
      },
    );

    it('확장자를 뺀 이름이 250바이트를 넘으면 글자가 깨지지 않게 잘린다', () => {
      // given
      const originalName = `${'가'.repeat(100)}.png`;
      const expected = `${'가'.repeat(83)}.png`;

      // when
      const attachment = Attachment.of({
        order: 1,
        originalName,
        header: PNG_HEADER,
        path: '/tmp/file',
        size: 10,
      });

      // then
      expect(attachment.fileName).toBe(expected);
    });

    it.each([
      { name: '허용하지 않는 형식', header: EXE_HEADER, size: 10 },
      { name: '0바이트', header: PNG_HEADER, size: 0 },
    ])('$name 파일은 첨부할 수 없다', ({ header, size }) => {
      // when & then
      expect(() =>
        Attachment.of({
          order: 1,
          originalName: 'a.png',
          header,
          path: '/tmp/file',
          size,
        }),
      ).toThrow(BadRequestException);
    });
  });
});
