import { FIT_GUTTER_PX, getFitScale } from './fit-scale';

describe('getFitScale', () => {
  it('여백을 빼고도 화면에 들어가면 줄이지 않는다', () => {
    // given
    const content = { width: 440, height: 570 };
    const viewport = { width: 1440, height: 900 };

    // when
    const scale = getFitScale(content, viewport);

    // then
    expect(scale).toBe(1);
  });

  it('너비가 넘치면 여백을 뺀 너비에 맞게 줄인다', () => {
    // given
    const content = { width: 440, height: 570 };
    const viewport = { width: 390, height: 844 };

    // when
    const scale = getFitScale(content, viewport);

    // then
    expect(scale).toBe((390 - FIT_GUTTER_PX * 2) / 440);
  });

  it('높이가 더 많이 넘치면 높이에 맞게 줄인다 (폰 가로)', () => {
    // given
    const content = { width: 440, height: 570 };
    const viewport = { width: 750, height: 340 };

    // when
    const scale = getFitScale(content, viewport);

    // then
    expect(scale).toBe((340 - FIT_GUTTER_PX * 2) / 570);
  });

  it('크기를 아직 재지 못했으면(0) 줄이지 않는다', () => {
    // given
    const content = { width: 0, height: 0 };

    // when
    const scale = getFitScale(content, { width: 390, height: 844 });

    // then
    expect(scale).toBe(1);
  });
});
