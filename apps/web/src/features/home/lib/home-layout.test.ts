import { SCENE_EDGE_PX, getHomeLayout, getSceneOffsetPx } from './home-layout';

describe('getHomeLayout', () => {
  it('너비 1200 이상이면 desktop이다', () => {
    // given
    const size = { width: 1200, height: 500 };

    // when
    const result = getHomeLayout(size);

    // then
    expect(result).toBe('desktop');
  });

  it('너비 1199면 medium이다', () => {
    // given
    const size = { width: 1199, height: 800 };

    // when
    const result = getHomeLayout(size);

    // then
    expect(result).toBe('medium');
  });

  it('너비 870이면 medium이다', () => {
    // given
    const size = { width: 870, height: 600 };

    // when
    const result = getHomeLayout(size);

    // then
    expect(result).toBe('medium');
  });

  it('너비 869이고 세로가 길면 portrait다', () => {
    // given
    const size = { width: 869, height: 1000 };

    // when
    const result = getHomeLayout(size);

    // then
    expect(result).toBe('portrait');
  });

  it('너비 869이고 가로가 길면 landscape다', () => {
    // given
    const size = { width: 869, height: 400 };

    // when
    const result = getHomeLayout(size);

    // then
    expect(result).toBe('landscape');
  });

  it('너비와 높이가 같으면 portrait다', () => {
    // given
    const size = { width: 600, height: 600 };

    // when
    const result = getHomeLayout(size);

    // then
    expect(result).toBe('portrait');
  });

  it('데스크톱·중간은 높이와 상관없다', () => {
    // given
    const heights = [100, 700, 3000];

    // when
    const results = heights.map((height) => [
      getHomeLayout({ width: 1200, height }),
      getHomeLayout({ width: 1000, height }),
    ]);

    // then
    for (const [desktop, medium] of results) {
      expect(desktop).toBe('desktop');
      expect(medium).toBe('medium');
    }
  });
});

describe('getSceneOffsetPx', () => {
  const visible = { top: 0, bottom: 800 };

  it('말풍선이 보이는 영역 안이면 옮기지 않는다', () => {
    // given
    const popover = { top: 300, bottom: 500 };

    // when
    const result = getSceneOffsetPx({
      popover,
      group: popover,
      visible,
      shouldCenterGroup: false,
    });

    // then
    expect(result).toBe(0);
  });

  it('키보드가 말풍선을 가리면 말풍선 윗면을 보이는 영역 맨 위로 올린다', () => {
    // given
    const popover = { top: 400, bottom: 600 };
    const visibleWithKeyboard = { top: 54, bottom: 450 };

    // when
    const result = getSceneOffsetPx({
      popover,
      group: popover,
      visible: visibleWithKeyboard,
      shouldCenterGroup: false,
    });

    // then
    expect(popover.top + result).toBe(visibleWithKeyboard.top + SCENE_EDGE_PX);
  });

  it('말풍선이 영역보다 크면 윗면을 맞추고 아래는 잘린다', () => {
    // given
    const popover = { top: 200, bottom: 390 };
    const smallVisible = { top: 0, bottom: 143 };

    // when
    const result = getSceneOffsetPx({
      popover,
      group: popover,
      visible: smallVisible,
      shouldCenterGroup: false,
    });

    // then
    expect(popover.top + result).toBe(SCENE_EDGE_PX);
    expect(popover.bottom + result).toBeGreaterThan(smallVisible.bottom);
  });

  it('가로 휴대폰에서는 말풍선과 한 줄 묶음을 가운데에 둔다', () => {
    // given
    const popover = { top: 100, bottom: 250 };
    const group = { top: 100, bottom: 300 };
    const landscapeVisible = { top: 0, bottom: 393 };

    // when
    const result = getSceneOffsetPx({
      popover,
      group,
      visible: landscapeVisible,
      shouldCenterGroup: true,
    });

    // then
    const expectedOffset = 393 / 2 - 200;
    expect(result).toBe(expectedOffset);
  });
});
