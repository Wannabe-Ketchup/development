import {
  BASE_HEIGHT_PX,
  BASE_WIDTH_PX,
  MIN_SCALE,
  getPageViewportMode,
  getRoomViewportMode,
} from './viewport-mode';

describe('getPageViewportMode', () => {
  it('기준 크기(1440×820) 이상이면 축소하지 않는다', () => {
    // given
    const size = { width: 1920, height: 970 };

    // when
    const result = getPageViewportMode(size);

    // then
    expect(result).toEqual({ mode: 'full' });
    expect(
      getPageViewportMode({ width: BASE_WIDTH_PX, height: BASE_HEIGHT_PX }),
    ).toEqual({
      mode: 'full',
    });
  });

  it('가로 화면이 기준보다 작으면 가로·세로 중 더 많이 줄여야 하는 쪽 배율로 축소한다', () => {
    // given
    const size = { width: 1024, height: 700 };

    // when
    const result = getPageViewportMode(size);

    // then
    expect(result).toEqual({ mode: 'scaled', scale: 1024 / BASE_WIDTH_PX });
  });

  it('배율이 정확히 최소 배율이면 축소해 보여 준다', () => {
    // given
    const size = { width: 936, height: 820 };

    // when
    const result = getPageViewportMode(size);

    // then
    expect(size.width / BASE_WIDTH_PX).toBe(MIN_SCALE);
    expect(result).toEqual({ mode: 'scaled', scale: MIN_SCALE });
  });

  it('배율이 최소 배율보다 작으면 안내한다', () => {
    // given
    const size = { width: 1000, height: 400 };

    // when
    const result = getPageViewportMode(size);

    // then
    expect(result).toEqual({ mode: 'unsupported' });
  });

  it('가로와 세로가 같으면 가로로 본다', () => {
    // given
    const size = { width: 1000, height: 1000 };

    // when
    const result = getPageViewportMode(size);

    // then
    expect(result).toEqual({ mode: 'scaled', scale: 1000 / BASE_WIDTH_PX });
  });
});

describe('getRoomViewportMode', () => {
  it('방은 너비 869 mobile, 870·1079 tablet, 1080 desktop이고 높이와 상관없다', () => {
    // given
    const heights = [300, 640, 852, 2000];

    // when
    const results = heights.map((height) => ({
      mobile: getRoomViewportMode({ width: 869, height }),
      tabletMin: getRoomViewportMode({ width: 870, height }),
      tabletMax: getRoomViewportMode({ width: 1079, height }),
      desktop: getRoomViewportMode({ width: 1080, height }),
    }));

    // then
    for (const result of results) {
      expect(result.mobile).toEqual({ mode: 'compact', layout: 'mobile' });
      expect(result.tabletMin).toEqual({ mode: 'compact', layout: 'tablet' });
      expect(result.tabletMax).toEqual({ mode: 'compact', layout: 'tablet' });
      expect(result.desktop).toEqual({ mode: 'desktop' });
    }
  });
});
