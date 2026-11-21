import { act, fireEvent, render, screen } from '@testing-library/react';
import { FLIP_DURATION_MS, JUMP_STAGGER_MS } from '../lib/intro-book';
import { IntroBook } from './IntroBook';

const getDialog = () =>
  screen.getByRole('dialog', { hidden: true }) as HTMLDialogElement;

const renderOpenedBook = (onClose = vi.fn()) => {
  const view = render(<IntroBook isOpen onClose={onClose} />);
  return { ...view, onClose };
};

describe('IntroBook', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal('matchMedia', () => ({
      matches: false,
      addEventListener: () => {},
      removeEventListener: () => {},
    }));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('닫혀 있어도 모든 장의 글이 DOM에 있다', () => {
    // when
    render(<IntroBook isOpen={false} onClose={vi.fn()} />);

    // then
    expect(getDialog().hasAttribute('open')).toBe(false);
    expect(screen.queryByText('워너비케챱은?')).not.toBeNull();
    expect(screen.queryByText('자주 묻는 질문')).not.toBeNull();
    expect(
      screen.getAllByRole('heading', { level: 1, hidden: true }),
    ).toHaveLength(1);
  });

  it('열면 기다림 없이 첫 장이 펼쳐져 있고 "1 / 5"를 알린다', () => {
    // when
    renderOpenedBook();

    // then
    expect(getDialog().hasAttribute('open')).toBe(true);
    expect(screen.queryByText('1 / 5')).not.toBeNull();
    expect(screen.getByText('차례').closest('[inert]')).toBeNull();
  });

  it('다음 버튼과 오른쪽 방향키로 장이 넘어간다', () => {
    // given
    renderOpenedBook();

    // when
    fireEvent.click(screen.getByRole('button', { name: '다음 장' }));
    act(() => vi.advanceTimersByTime(FLIP_DURATION_MS));
    expect(screen.queryByText('2 / 5')).not.toBeNull();
    fireEvent.keyDown(getDialog(), { key: 'ArrowRight' });

    // then
    expect(screen.queryByText('3 / 5')).not.toBeNull();
  });

  it('책갈피를 누르면 그 장으로 간다', () => {
    // given
    renderOpenedBook();

    // when
    fireEvent.click(screen.getByRole('button', { name: 'FAQ' }));
    act(() => vi.advanceTimersByTime(JUMP_STAGGER_MS * 4 + FLIP_DURATION_MS));

    // then
    expect(screen.queryByText('5 / 5')).not.toBeNull();
    expect(
      screen.getByRole('button', { name: 'FAQ' }).getAttribute('aria-current'),
    ).toBe('true');
  });

  it('책갈피로 장을 옮기면 넘김이 끝난 뒤 그 장 제목으로 포커스가 간다', () => {
    // given
    renderOpenedBook();

    // when
    fireEvent.click(screen.getByRole('button', { name: 'FAQ' }));
    act(() => vi.advanceTimersByTime(JUMP_STAGGER_MS * 4 + FLIP_DURATION_MS));

    // then
    const heading = screen.getByRole('heading', { name: '자주 묻는 질문' });
    expect(document.activeElement).toBe(heading);
    expect(heading.getAttribute('tabindex')).toBe('-1');
  });

  it('다음 장 버튼으로 넘기면 포커스는 버튼에 남고 장 번호와 제목을 알린다', () => {
    // given
    renderOpenedBook();
    const nextButton = screen.getByRole('button', { name: '다음 장' });
    nextButton.focus();

    // when
    fireEvent.click(nextButton);
    act(() => vi.advanceTimersByTime(FLIP_DURATION_MS));

    // then
    expect(document.activeElement).toBe(nextButton);
    const liveRegion = getDialog().querySelector('[aria-live="polite"]');
    expect(liveRegion?.textContent).toBe('2 / 5, 뽀모도로란?');
  });

  it('현재 펼침이 아닌 면은 inert다', () => {
    // given
    renderOpenedBook();

    // when
    const currentFace = screen.getByText('차례').closest('[inert]');
    const otherFace = screen.getByText('워너비케챱은?').closest('[inert]');

    // then
    expect(currentFace).toBeNull();
    expect(otherFace).not.toBeNull();
  });

  it('마지막 장(FAQ)에서는 다음 장 버튼이 비활성화된다', () => {
    // given
    renderOpenedBook();

    // when
    fireEvent.click(screen.getByRole('button', { name: 'FAQ' }));
    act(() => vi.advanceTimersByTime(JUMP_STAGGER_MS * 4 + FLIP_DURATION_MS));

    // then
    expect(screen.queryByText('5 / 5')).not.toBeNull();
    expect(
      screen.getByRole('button', { name: '다음 장' }).hasAttribute('disabled'),
    ).toBe(true);
  });

  it('Esc를 한 번 누르면 onClose가 한 번 불린다', () => {
    // given
    const { onClose } = renderOpenedBook();

    // when
    fireEvent.keyDown(getDialog(), { key: 'Escape' });
    expect(onClose).not.toHaveBeenCalled();
    getDialog().close(); // 브라우저가 Esc의 기본 동작으로 닫는 것을 흉내 낸다

    // then
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('다른 장을 보다가 닫고 다시 열면 첫 장부터 보인다', () => {
    // given
    const onClose = vi.fn();
    const { rerender } = render(<IntroBook isOpen onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', { name: 'FAQ' }));
    act(() => vi.advanceTimersByTime(JUMP_STAGGER_MS * 4 + FLIP_DURATION_MS));

    // when
    rerender(<IntroBook isOpen={false} onClose={onClose} />);
    rerender(<IntroBook isOpen onClose={onClose} />);

    // then
    expect(screen.queryByText('1 / 5')).not.toBeNull();
  });
});
