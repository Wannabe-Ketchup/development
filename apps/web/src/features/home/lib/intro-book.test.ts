import {
  SHEET_COUNT,
  SPREAD_COUNT,
  getBookmarkOwner,
  getClickDirection,
  getNextSpread,
  getSheetLayout,
} from './intro-book';

describe('getNextSpread', () => {
  it('첫 장에서 이전으로 가도 그대로다', () => {
    // when
    const spread = getNextSpread(1, 'prev');

    // then
    expect(spread).toBe(1);
  });

  it('마지막 장에서 다음으로 가도 그대로다', () => {
    // when
    const spread = getNextSpread(SPREAD_COUNT, 'next');

    // then
    expect(spread).toBe(SPREAD_COUNT);
  });
});

describe('getBookmarkOwner', () => {
  it('마지막 장은 FAQ 책갈피에 속한다', () => {
    // when
    const owner = getBookmarkOwner(SPREAD_COUNT);

    // then
    const faqSpread = 5;
    expect(owner).toBe(faqSpread);
  });

  it('첫 장은 처음 책갈피에 속한다', () => {
    // when
    const owner = getBookmarkOwner(1);

    // then
    expect(owner).toBe(1);
  });
});

describe('getSheetLayout', () => {
  it('넘어간 종이는 번호가 클수록, 남은 종이는 번호가 작을수록 위에 쌓인다', () => {
    // given
    const spread = 3;
    const layouts = Array.from({ length: SHEET_COUNT }, (_, sheetIndex) =>
      getSheetLayout(sheetIndex, spread),
    );

    // when
    const flipped = layouts.filter((layout) => layout.isFlipped);
    const remaining = layouts.filter((layout) => !layout.isFlipped);

    // then
    expect(flipped).toHaveLength(spread);
    const flippedZ = flipped.map((layout) => layout.zIndex);
    const remainingZ = remaining.map((layout) => layout.zIndex);
    expect(flippedZ).toEqual([...flippedZ].sort((a, b) => a - b));
    expect(remainingZ).toEqual([...remainingZ].sort((a, b) => b - a));
  });
});

describe('getClickDirection', () => {
  it('책 오른쪽 절반을 누르면 다음, 왼쪽 절반을 누르면 이전이다', () => {
    // given
    const rect = { left: 100, width: 400 };

    // when
    const right = getClickDirection(400, rect);
    const left = getClickDirection(200, rect);

    // then
    expect(right).toBe('next');
    expect(left).toBe('prev');
  });
});
