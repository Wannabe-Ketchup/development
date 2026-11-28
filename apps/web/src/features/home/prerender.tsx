// vite build --ssr 진입점. 빌드 스크립트(scripts/prerender-home.js)가 불러 쓴다
import { renderToString } from 'react-dom/server';
import { IntroBookArticle } from './components/IntroBookFaces';

// 설명서의 SVG는 모두 장식(aria-hidden)이고 서로 겹쳐 들어가지 않는다.
// 검색용 HTML에는 글만 필요하므로 지워 index.html을 가볍게 한다
const SVG_ELEMENT_PATTERN = /<svg\b[\s\S]*?<\/svg>/g;

export function renderIntroBookHtml(): string {
  return renderToString(<IntroBookArticle />).replace(SVG_ELEMENT_PATTERN, '');
}
