import { useEffect, useRef, useState } from 'react';
import { getHomeLayout, type HomeLayout } from '../lib/home-layout';

function readHomeLayout(): HomeLayout {
  return getHomeLayout({
    width: window.innerWidth,
    height: window.innerHeight,
  });
}

function isTextInputFocused(): boolean {
  const active = document.activeElement;
  return (
    active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement
  );
}

// 창 크기로 레이아웃을 정한다. 입력칸에 포커스가 있는 동안 너비는 그대로 두고 높이만 바뀐 것은 화면 키보드로 보고 레이아웃을 유지한다
// (Android는 키보드가 올라오면 레이아웃 높이가 줄어 세로 화면이 가로로 뒤집힐 수 있다). 너비가 바뀌면(회전) 다시 정한다.
export function useHomeLayout(): HomeLayout {
  const [layout, setLayout] = useState(readHomeLayout);
  const lastWidth = useRef(window.innerWidth);

  useEffect(() => {
    const handleResize = () => {
      const isOnlyHeightChanged = window.innerWidth === lastWidth.current;
      if (isOnlyHeightChanged && isTextInputFocused()) return;

      lastWidth.current = window.innerWidth;
      setLayout(readHomeLayout());
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return layout;
}
