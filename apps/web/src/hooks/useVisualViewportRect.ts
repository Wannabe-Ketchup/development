import { useEffect, useState } from 'react';

// 핀치 줌 중에는 visualViewport가 줄어도 키보드가 아니므로 레이아웃 뷰포트를 쓴다
const UNZOOMED_SCALE = 1;

export interface VisualViewportRect {
  // 레이아웃 뷰포트 위에서 보이는 영역이 시작하는 위치. iOS는 입력창이 보이도록 화면을 밀어 0보다 커진다
  top: number;
  // 보이는 영역의 높이. 화면 키보드가 올라오면 줄어든다
  height: number;
  // 보이는 영역 아래로 가려진 높이(키보드)
  bottomInset: number;
}

export function readVisualViewportRect(): VisualViewportRect {
  const viewport = window.visualViewport;
  // iOS Safari는 키보드가 올라오면 innerHeight도 줄 수 있어, 키보드와 상관없는 레이아웃 뷰포트 높이를 쓴다
  const layoutHeight =
    document.documentElement.clientHeight || window.innerHeight;
  if (!viewport || viewport.scale !== UNZOOMED_SCALE) {
    return { top: 0, height: layoutHeight, bottomInset: 0 };
  }
  const top = Math.max(0, Math.round(viewport.offsetTop));
  const height = Math.round(viewport.height);
  return {
    top,
    height,
    bottomInset: Math.max(0, layoutHeight - top - height),
  };
}

// 화면 키보드에 가리지 않는 실제로 보이는 영역. iOS는 키보드가 올라와도 레이아웃 높이(dvh)를 줄이지 않아서,
// 키보드 위에 붙어야 하는 시트는 이 영역에 맞춰 놓는다
export function useVisualViewportRect(): VisualViewportRect {
  const [rect, setRect] = useState(readVisualViewportRect);

  useEffect(() => {
    const viewport = window.visualViewport;
    const update = () => {
      const next = readVisualViewportRect();
      setRect((current) =>
        current.top === next.top &&
        current.height === next.height &&
        current.bottomInset === next.bottomInset
          ? current
          : next,
      );
    };

    update();
    viewport?.addEventListener('resize', update);
    viewport?.addEventListener('scroll', update);
    window.addEventListener('resize', update);
    return () => {
      viewport?.removeEventListener('resize', update);
      viewport?.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, []);

  return rect;
}
