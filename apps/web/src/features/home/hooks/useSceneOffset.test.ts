import { act, renderHook } from '@testing-library/react';
import { useSceneOffset } from './useSceneOffset';

const viewport = vi.hoisted(() => ({ top: 0, height: 400, bottomInset: 0 }));
vi.mock('@/hooks/useVisualViewportRect', () => ({
  useVisualViewportRect: () => viewport,
}));

function createScene() {
  const scene = document.createElement('div');
  const row = document.createElement('div');
  const popover = document.createElement('div');
  const alert = document.createElement('div');
  alert.setAttribute('role', 'alert');
  popover.append(alert);
  row.append(popover);
  scene.append(row);

  const offset = () => Number(scene.style.transform.match(/-?\d+/)?.[0] ?? 0);
  const rect = (top: number, bottom: number) =>
    ({ top: top + offset(), bottom: bottom + offset() }) as DOMRect;
  scene.getBoundingClientRect = () => rect(0, 400);
  row.getBoundingClientRect = () => rect(150, 250);
  popover.getBoundingClientRect = () => rect(100, 250);
  alert.getBoundingClientRect = () => rect(64, 92);

  return {
    scene,
    alert,
    params: {
      layout: 'landscape' as const,
      isPopoverOpen: true,
      sceneRef: { current: scene },
      rowRef: { current: row },
      popoverRef: { current: popover },
    },
  };
}

describe('useSceneOffset', () => {
  let onResize: () => void;
  let observed: Element[];

  beforeEach(() => {
    viewport.top = 0;
    viewport.height = 400;
    observed = [];
    vi.stubGlobal(
      'ResizeObserver',
      class {
        constructor(callback: () => void) {
          onResize = callback;
        }
        observe(element: Element) {
          observed.push(element);
        }
        disconnect() {}
      },
    );
  });

  afterEach(() => vi.unstubAllGlobals());

  it('빈 오류 영역은 빼고 말풍선과 한 줄을 가운데에 둔다', () => {
    const { scene, params } = createScene();

    renderHook(() => useSceneOffset(params));

    expect(scene.style.transform).toBe('translateY(25px)');
  });

  it('오류가 나타나면 오류 문구까지 포함해 다시 가운데에 둔다', () => {
    const { scene, alert, params } = createScene();
    renderHook(() => useSceneOffset(params));
    expect(observed).toContain(alert);

    act(() => {
      alert.textContent = '찾을 수 없는 방입니다.';
      onResize();
    });

    expect(scene.style.transform).toBe('translateY(43px)');
  });

  it('키보드가 가리면 윗면을 맞추고 키보드와 말풍선을 닫으면 원위치로 돌아간다', () => {
    const { scene, params } = createScene();
    const { rerender } = renderHook(
      ({ isPopoverOpen }) => useSceneOffset({ ...params, isPopoverOpen }),
      { initialProps: { isPopoverOpen: true } },
    );

    viewport.height = 120;
    rerender({ isPopoverOpen: true });
    expect(scene.style.transform).toBe('translateY(-88px)');

    viewport.height = 400;
    rerender({ isPopoverOpen: true });
    expect(scene.style.transform).toBe('translateY(25px)');

    rerender({ isPopoverOpen: false });
    expect(scene.style.transform).toBe('');
  });
});
