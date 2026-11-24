import {
  injectPrerender,
  PRERENDER_MARKER,
  REQUIRED_TEXT,
} from './inject-prerender.js';

const HTML = `<div id="root">${PRERENDER_MARKER}</div>`;
const MARKUP = `<article>${REQUIRED_TEXT}</article>`;

describe('injectPrerender', () => {
  it('마커를 숨김 래퍼로 바꾼다', () => {
    // when
    const result = injectPrerender(HTML, MARKUP);

    // then
    expect(result).toBe(
      `<div id="root"><div hidden data-prerender="intro-book">${MARKUP}</div></div>`,
    );
  });

  it('마커가 없으면 예외를 던진다', () => {
    // when
    const inject = () => injectPrerender('<div id="root"></div>', MARKUP);

    // then
    expect(inject).toThrow('마커');
  });

  it('결과에 핵심 문구가 없으면 예외를 던진다', () => {
    // when
    const inject = () => injectPrerender(HTML, '<article>다른 글</article>');

    // then
    expect(inject).toThrow(REQUIRED_TEXT);
  });

  it('결과가 비어 있으면 예외를 던진다', () => {
    // when
    const inject = () => injectPrerender(HTML, '  ');

    // then
    expect(inject).toThrow('비어');
  });
});
