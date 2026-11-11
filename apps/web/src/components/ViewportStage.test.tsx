import { act, render, screen } from '@testing-library/react';
import { useStageScale } from '@/hooks/useStageScale';
import { ViewportStage } from './ViewportStage';

function setWindowSize(width: number, height: number) {
  Object.defineProperty(window, 'innerWidth', {
    configurable: true,
    value: width,
  });
  Object.defineProperty(window, 'innerHeight', {
    configurable: true,
    value: height,
  });
}

function ScaleProbe() {
  return <p data-testid="scale">{useStageScale()}</p>;
}

describe('ViewportStage', () => {
  const originalSize = {
    width: window.innerWidth,
    height: window.innerHeight,
  };

  afterEach(() => {
    setWindowSize(originalSize.width, originalSize.height);
  });

  it('지원하지 않는 화면이면 자식을 렌더하지 않고 안내를 보여 준다', () => {
    // given
    setWindowSize(390, 844);

    // when
    render(
      <ViewportStage notice={<p>안내</p>}>
        <p>방 화면</p>
      </ViewportStage>,
    );

    // then
    expect(screen.queryByText('방 화면')).toBeNull();
    screen.getByText('안내');
  });

  it('화면이 세로로 바뀌면 자식이 언마운트된다', () => {
    // given
    setWindowSize(1440, 900);
    render(
      <ViewportStage notice={<p>안내</p>}>
        <p>방 화면</p>
      </ViewportStage>,
    );
    screen.getByText('방 화면');

    // when
    act(() => {
      setWindowSize(900, 1440);
      window.dispatchEvent(new Event('resize'));
    });

    // then
    expect(screen.queryByText('방 화면')).toBeNull();
  });

  it('축소 화면이면 자식에 배율을 제공한다 (useStageScale 값)', () => {
    // given
    setWindowSize(1024, 700);

    // when
    render(
      <ViewportStage notice={<p>안내</p>}>
        <ScaleProbe />
      </ViewportStage>,
    );

    // then
    expect(screen.getByTestId('scale').textContent).toBe(String(1024 / 1440));
  });
});
