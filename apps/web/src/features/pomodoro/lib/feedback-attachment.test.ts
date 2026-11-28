import { describe, expect, it } from 'vitest';
import { checkFeedbackAttachments } from './feedback-attachment';

function fileOf(name: string, size = 1): File {
  return new File([new Uint8Array(size)], name);
}

describe('checkFeedbackAttachments', () => {
  it.each([
    { name: 'a.png', ok: true },
    { name: 'A.PNG', ok: true },
    { name: 'a.png.exe', ok: false },
    { name: 'a.exe.png', ok: true },
    { name: 'png', ok: false },
    { name: 'a.heic', ok: false },
  ])('$name 파일은 허용 여부가 $ok이다', ({ name, ok }) => {
    // given
    const files = [fileOf(name)];

    // when
    const result = checkFeedbackAttachments(files);

    // then
    expect(result.ok).toBe(ok);
  });

  it('0바이트 파일은 첨부할 수 없다', () => {
    // given
    const files = [fileOf('a.png', 0)];

    // when
    const result = checkFeedbackAttachments(files);

    // then
    expect(result.ok).toBe(false);
  });

  it.each([
    { total: 18_000_000, ok: true },
    { total: 18_000_001, ok: false },
  ])('첨부 합계가 $total바이트이면 허용 여부가 $ok이다', ({ total, ok }) => {
    // given
    const files = [fileOf('a.mp4', total)];

    // when
    const result = checkFeedbackAttachments(files);

    // then
    expect(result.ok).toBe(ok);
  });

  it.each([
    { count: 500, ok: true },
    { count: 501, ok: false },
  ])('첨부가 $count개이면 허용 여부가 $ok이다', ({ count, ok }) => {
    // given
    const files = Array.from({ length: count }, () => fileOf('a.png'));

    // when
    const result = checkFeedbackAttachments(files);

    // then
    expect(result.ok).toBe(ok);
  });
});
