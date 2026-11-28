export const PRERENDER_MARKER = '<!--prerender:intro-book-->';
// 결과에 반드시 있어야 하는 문구. 없으면 내용이 빠진 것으로 보고 빌드를 멈춘다
export const REQUIRED_TEXT = '자주 묻는 질문';

// 마커를 <div hidden data-prerender="intro-book">{markup}</div>로 바꾼다.
// 마커가 없거나, markup이 비었거나, REQUIRED_TEXT가 없으면 throw 한다
export function injectPrerender(html, markup) {
  if (!html.includes(PRERENDER_MARKER)) {
    throw new Error(`index.html에 ${PRERENDER_MARKER} 마커가 없습니다.`);
  }
  if (markup.trim() === '') {
    throw new Error('프리렌더 결과가 비어 있습니다.');
  }
  if (!markup.includes(REQUIRED_TEXT)) {
    throw new Error(`프리렌더 결과에 "${REQUIRED_TEXT}" 문구가 없습니다.`);
  }
  // 치환 문자열의 $& 같은 특수 패턴이 markup에 있어도 그대로 들어가도록 함수로 넘긴다
  return html.replace(
    PRERENDER_MARKER,
    () => `<div hidden data-prerender="intro-book">${markup}</div>`,
  );
}
