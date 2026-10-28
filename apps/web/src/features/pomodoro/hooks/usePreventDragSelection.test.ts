import type { PointerEvent } from 'react';
import { act, renderHook } from '@testing-library/react';
import { usePreventDragSelection } from './usePreventDragSelection';

const createInput = (value: string) => {
  const input = document.createElement('input');
  input.value = value;
  document.body.append(input);
  return input;
};

const pointerDownOn = (input: HTMLInputElement) =>
  ({ currentTarget: input }) as PointerEvent<HTMLInputElement>;

describe('usePreventDragSelection', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('누르는 동안에는 isPointerDown이 true이고, 떼면 false로 돌아온다', () => {
    // given
    const input = createInput('코딩하는 중');
    const { result } = renderHook(() => usePreventDragSelection());

    // when
    act(() => result.current.onPointerDown(pointerDownOn(input)));

    // then
    expect(result.current.isPointerDown).toBe(true);

    // when
    act(() => window.dispatchEvent(new Event('pointerup')));

    // then
    expect(result.current.isPointerDown).toBe(false);
  });

  it('오른쪽에서 왼쪽으로 끌어 선택한 뒤 떼면 포인터를 뗀 왼쪽 끝의 커서로 접힌다', () => {
    // given
    const input = createInput('코딩하는 중');
    const { result } = renderHook(() => usePreventDragSelection());
    input.setSelectionRange(6, 6);
    act(() => result.current.onPointerDown(pointerDownOn(input)));
    input.setSelectionRange(1, 6);

    // when
    act(() => window.dispatchEvent(new Event('pointerup')));

    // then
    expect([input.selectionStart, input.selectionEnd]).toEqual([1, 1]);
  });

  it('왼쪽에서 오른쪽으로 끌어 선택한 뒤 떼면 포인터를 뗀 오른쪽 끝의 커서로 접힌다', () => {
    // given
    const input = createInput('코딩하는 중');
    const { result } = renderHook(() => usePreventDragSelection());
    input.setSelectionRange(1, 1);
    act(() => result.current.onPointerDown(pointerDownOn(input)));
    input.setSelectionRange(1, 5);

    // when
    act(() => window.dispatchEvent(new Event('pointerup')));

    // then
    expect([input.selectionStart, input.selectionEnd]).toEqual([5, 5]);
  });

  it('누르지 않은 상태에서 만든 선택(키보드 선택)은 그대로 둔다', () => {
    // given
    const input = createInput('코딩하는 중');
    renderHook(() => usePreventDragSelection());
    input.setSelectionRange(0, 6);

    // when
    act(() => window.dispatchEvent(new Event('pointerup')));

    // then
    expect([input.selectionStart, input.selectionEnd]).toEqual([0, 6]);
  });
});
