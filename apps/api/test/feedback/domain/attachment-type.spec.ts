import {
  ATTACHMENT_TYPE,
  detectAttachmentType,
} from '../../../src/feedback/domain/attachment-type';
import {
  AVIF_HEADER,
  EMPTY_HEADER,
  EXE_HEADER,
  GIF_HEADER,
  HEIC_HEADER,
  JPEG_HEADER,
  MKV_HEADER,
  MOV_HEADER,
  MP4_HEADER,
  PNG_HEADER,
  TRUNCATED_PNG_HEADER,
  WAV_HEADER,
  WEBM_HEADER,
  WEBP_HEADER,
} from '../attachment-headers';

describe('detectAttachmentType', () => {
  it.each([
    { name: 'PNG', header: PNG_HEADER, expected: ATTACHMENT_TYPE.PNG },
    { name: 'JPEG', header: JPEG_HEADER, expected: ATTACHMENT_TYPE.JPEG },
    { name: 'GIF', header: GIF_HEADER, expected: ATTACHMENT_TYPE.GIF },
    { name: 'WebP', header: WEBP_HEADER, expected: ATTACHMENT_TYPE.WEBP },
    { name: 'MP4', header: MP4_HEADER, expected: ATTACHMENT_TYPE.MP4 },
    { name: 'MOV', header: MOV_HEADER, expected: ATTACHMENT_TYPE.MOV },
    { name: 'WebM', header: WEBM_HEADER, expected: ATTACHMENT_TYPE.WEBM },
  ])(
    '$name 파일은 $expected.mimeType 형식으로 판별된다',
    ({ header, expected }) => {
      // when
      const type = detectAttachmentType(header);

      // then
      expect(type).toBe(expected);
    },
  );

  it.each([
    { name: 'EXE', header: EXE_HEADER },
    { name: 'HEIC', header: HEIC_HEADER },
    { name: 'AVIF', header: AVIF_HEADER },
    { name: 'MKV', header: MKV_HEADER },
    { name: 'WAV', header: WAV_HEADER },
    { name: '0바이트', header: EMPTY_HEADER },
    { name: '잘린 PNG', header: TRUNCATED_PNG_HEADER },
  ])('$name 파일은 첨부할 수 있는 형식이 아니다', ({ header }) => {
    // when
    const type = detectAttachmentType(header);

    // then
    expect(type).toBeUndefined();
  });
});
