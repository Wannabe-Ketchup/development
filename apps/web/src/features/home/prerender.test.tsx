// @vitest-environment node
import { renderIntroBookHtml } from './prerender';
import { INTRO_BOOK_FACES } from './components/IntroBookFaces';

describe('renderIntroBookHtml', () => {
  it('브라우저 전역 없이 모든 면의 글을 HTML로 만든다', () => {
    // given
    const hasWindow = typeof window !== 'undefined';

    // when
    const html = renderIntroBookHtml();

    // then
    expect(hasWindow).toBe(false);
    expect(html).toContain('뽀모도로란?');
    expect(html).toContain('자주 묻는 질문');
    expect(html.match(/<section/g)).toHaveLength(INTRO_BOOK_FACES.length);
  });

  it('장식용 그림(SVG)은 빼고 글만 남긴다', () => {
    // when
    const html = renderIntroBookHtml();

    // then
    expect(html).not.toContain('<svg');
    expect(html).not.toContain('</svg>');
    expect(html).toContain('워너비케챱은?');
  });
});
