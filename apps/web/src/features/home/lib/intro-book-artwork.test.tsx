// @vitest-environment node
// jsdom에서는 squiggle 계산이 실패해 원래 경로를 돌려주므로, 브라우저 전역이 없는 환경에서 계산한다
import { renderToString } from 'react-dom/server';
import { useSquigglePath } from '@squiggle-line/react';
import {
  ROUND_BUTTON_PATH,
  SMALL_ARTWORK_SQUIGGLE,
  STEP_NUMBER_PATH,
} from './intro-book-artwork';

const toNumbers = (path: string) =>
  (path.match(/-?\d+(\.\d+)?/g) ?? []).map(Number);

function SquiggledRoundButtonPath() {
  return (
    <path d={useSquigglePath(ROUND_BUTTON_PATH, SMALL_ARTWORK_SQUIGGLE)} />
  );
}

describe('STEP_NUMBER_PATH', () => {
  it('둥근 버튼 경로에 같은 squiggle을 적용한 결과와 같다', () => {
    // given
    const html = renderToString(<SquiggledRoundButtonPath />);
    const squiggled = html.match(/ d="([^"]+)"/)?.[1] ?? '';

    // when
    const expected = toNumbers(squiggled);
    const actual = toNumbers(STEP_NUMBER_PATH);

    // then
    expect(actual).toHaveLength(expected.length);
    actual.forEach((value, index) => {
      expect(value).toBeCloseTo(expected[index], 1);
    });
  });
});
