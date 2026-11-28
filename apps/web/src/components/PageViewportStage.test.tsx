import { act, render, screen } from '@testing-library/react';
import { useStageScale } from '@/hooks/useStageScale';
import { PageViewportStage } from './PageViewportStage';

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

describe('PageViewportStage', () => {
  const originalSize = {
    width: window.innerWidth,
    height: window.innerHeight,
  };

  afterEach(() => {
    setWindowSize(originalSize.width, originalSize.height);
  });

  it('홈은 너비 936 미만에서 안내를 보여 준다', () => {
    // given
    setWindowSize(935, 900);

    // when
    render(
      <PageViewportStage notice={<p>안내</p>}>
        <p>홈 화면</p>
      </PageViewportStage>,
    );

    // then
    expect(screen.queryByText('홈 화면')).toBeNull();
    screen.getByText('안내');
  });

  it('좁은 휴대폰 화면에서도 안내를 보여 준다', () => {
    // given
    setWindowSize(393, 852);

    // when
    render(
      <PageViewportStage notice={<p>안내</p>}>
        <p>홈 화면</p>
      </PageViewportStage>,
    );

    // then
    screen.getByText('안내');
    expect(screen.queryByText('홈 화면')).toBeNull();
  });

  it('화면이 지원 범위 밖으로 바뀌면 자식이 언마운트된다', () => {
    // given
    setWindowSize(1440, 900);
    render(
      <PageViewportStage notice={<p>안내</p>}>
        <p>홈 화면</p>
      </PageViewportStage>,
    );
    screen.getByText('홈 화면');

    // when
    act(() => {
      setWindowSize(1440, 400);
      window.dispatchEvent(new Event('resize'));
    });

    // then
    expect(screen.queryByText('홈 화면')).toBeNull();
  });

  it('축소 화면이면 자식에 배율을 제공한다 (useStageScale 값)', () => {
    // given
    setWindowSize(1024, 700);

    // when
    render(
      <PageViewportStage notice={<p>안내</p>}>
        <ScaleProbe />
      </PageViewportStage>,
    );

    // then
    expect(screen.getByTestId('scale').textContent).toBe(String(1024 / 1440));
  });
});
