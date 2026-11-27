import { useEffect } from 'react';
import { act, render, screen } from '@testing-library/react';
import { useStageScale } from '@/hooks/useStageScale';
import { RoomViewportStage } from './RoomViewportStage';

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

describe('RoomViewportStage', () => {
  const originalSize = {
    width: window.innerWidth,
    height: window.innerHeight,
  };

  afterEach(() => {
    setWindowSize(originalSize.width, originalSize.height);
  });

  it('방은 낮고 좁은 창에서도 안내 없이 화면을 그린다', () => {
    // given
    const sizes = [
      { width: 1200, height: 300 },
      { width: 1080, height: 500 },
      { width: 393, height: 852 },
    ];

    for (const size of sizes) {
      setWindowSize(size.width, size.height);

      // when
      const { unmount } = render(
        <RoomViewportStage renderCompact={(layout) => <p>{layout} 화면</p>}>
          <p>방 화면</p>
        </RoomViewportStage>,
      );

      // then
      expect(
        screen.queryByText('방 화면') ?? screen.queryByText('mobile 화면'),
      ).not.toBeNull();
      unmount();
    }
  });

  it('방 데스크톱은 창 크기와 상관없이 줄이지 않고 창을 넘지 않는다', () => {
    // given
    const sizes = [
      { width: 1080, height: 500 },
      { width: 1440, height: 820 },
      { width: 2560, height: 1440 },
    ];

    for (const size of sizes) {
      setWindowSize(size.width, size.height);

      // when
      const { unmount } = render(
        <RoomViewportStage renderCompact={() => null}>
          <ScaleProbe />
        </RoomViewportStage>,
      );

      // then
      expect(screen.getByTestId('scale').textContent).toBe('1');
      const room = screen.getByTestId('desktop-room');
      expect(room.style.transform).toBe('');
      expect(room.className).toContain('overflow-hidden');
      unmount();
    }
  });

  it('좁은 화면이면 layout에 맞는 좁은 화면용 페이지를 보여 준다', () => {
    // given
    setWindowSize(393, 852);

    // when
    render(
      <RoomViewportStage renderCompact={(layout) => <p>{layout} 화면</p>}>
        <p>방 화면</p>
      </RoomViewportStage>,
    );

    // then
    screen.getByText('mobile 화면');
    expect(screen.queryByText('방 화면')).toBeNull();
  });

  it('mobile과 tablet 사이를 오가도 페이지가 다시 마운트되지 않는다', () => {
    // given
    setWindowSize(393, 852);
    const onMount = vi.fn();
    function CompactProbe({ layout }: { layout: string }) {
      useEffect(onMount, []);
      return <p>{layout}</p>;
    }
    render(
      <RoomViewportStage
        renderCompact={(layout) => <CompactProbe layout={layout} />}
      >
        <p>방 화면</p>
      </RoomViewportStage>,
    );
    screen.getByText('mobile');

    // when
    act(() => {
      setWindowSize(1024, 1366);
      window.dispatchEvent(new Event('resize'));
    });

    // then
    screen.getByText('tablet');
    expect(onMount).toHaveBeenCalledTimes(1);
  });
});
