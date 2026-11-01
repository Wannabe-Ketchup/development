import { useState, type PointerEvent } from 'react';

// 선택 방향(selectionDirection)은 macOS에서 마우스 선택이어도 'none'이라, 누른 직후의 커서 위치(시작점)와 비교해 떼는 쪽 끝을 찾는다
const collapseToPointerEnd = (input: HTMLInputElement, anchor: number) => {
  const caret =
    input.selectionStart === anchor ? input.selectionEnd : input.selectionStart;
  input.setSelectionRange(caret, caret);
};

// 마우스로 끌거나 더블클릭해 생긴 입력칸 선택을 막는다. 누르는 동안에는 선택 색을 숨기고, 떼면 포인터를 뗀 위치의 커서로 접는다. 키보드 선택은 그대로 둔다
export function usePreventDragSelection() {
  const [isPointerDown, setIsPointerDown] = useState(false);

  const handlePointerDown = (event: PointerEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    let anchor = input.selectionStart ?? 0;
    // 누른 위치로 커서가 옮겨지는 것은 이 이벤트가 끝난 뒤라 다음 틱에 읽는다
    setTimeout(() => {
      anchor = input.selectionStart ?? 0;
    });
    setIsPointerDown(true);
    window.addEventListener(
      'pointerup',
      () => {
        collapseToPointerEnd(input, anchor);
        setIsPointerDown(false);
      },
      { once: true },
    );
  };

  return { isPointerDown, onPointerDown: handlePointerDown };
}
