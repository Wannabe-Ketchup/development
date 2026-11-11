import {
  BASE_HEIGHT_PX,
  BASE_WIDTH_PX,
  MIN_SCALE,
  getViewportMode,
} from './viewport-mode';

describe('getViewportMode', () => {
  it('기준 크기(1440×820) 이상이면 축소하지 않는다', () => {
    // given
    const size = { width: 1920, height: 970 };

    // when
    const result = getViewportMode(size);

    // then
    expect(result).toEqual({ mode: 'full' });
    expect(
      getViewportMode({ width: BASE_WIDTH_PX, height: BASE_HEIGHT_PX }),
    ).toEqual({
      mode: 'full',
    });
  });

  it('가로 화면이 기준보다 작으면 가로·세로 중 더 많이 줄여야 하는 쪽 배율로 축소한다', () => {
    // given
    const size = { width: 1024, height: 700 };

    // when
    const result = getViewportMode(size);

    // then
    expect(result).toEqual({ mode: 'scaled', scale: 1024 / BASE_WIDTH_PX });
  });

  it('배율이 정확히 최소 배율이면 축소해 보여 준다', () => {
    // given
    const size = { width: 936, height: 820 };

    // when
    const result = getViewportMode(size);

    // then
    expect(size.width / BASE_WIDTH_PX).toBe(MIN_SCALE);
    expect(result).toEqual({ mode: 'scaled', scale: MIN_SCALE });
  });

  it('배율이 최소 배율보다 작으면 too-small로 안내한다', () => {
    // given
    const size = { width: 750, height: 340 };

    // when
    const result = getViewportMode(size);

    // then
    expect(result).toEqual({ mode: 'unsupported', reason: 'too-small' });
  });

  it('세로가 가로보다 길면 크기와 관계없이 portrait로 안내한다', () => {
    // given
    const size = { width: 1024, height: 1366 };

    // when
    const result = getViewportMode(size);

    // then
    expect(result).toEqual({ mode: 'unsupported', reason: 'portrait' });
  });

  it('가로와 세로가 같으면 가로로 본다', () => {
    // given
    const size = { width: 1000, height: 1000 };

    // when
    const result = getViewportMode(size);

    // then
    expect(result).toEqual({ mode: 'scaled', scale: 1000 / BASE_WIDTH_PX });
  });
});
