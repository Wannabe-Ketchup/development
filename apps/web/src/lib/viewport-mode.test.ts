import { getRoomViewportMode } from './viewport-mode';

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
