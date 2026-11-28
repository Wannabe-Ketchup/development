import { fireEvent, render, screen } from '@testing-library/react';
import { Modal } from './Modal';

function renderModal(onClose?: () => void) {
  render(
    <Modal labelledBy="modal-title" onClose={onClose}>
      <h2 id="modal-title">제목</h2>
    </Modal>,
  );
  return screen.getByRole('dialog', { name: '제목' });
}

describe('Modal', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('onClose가 없으면 Esc(cancel)를 막는다', () => {
    // given
    const dialog = renderModal();
    const cancelEvent = new Event('cancel', { cancelable: true });

    // when
    fireEvent(dialog, cancelEvent);

    // then
    expect(cancelEvent.defaultPrevented).toBe(true);
  });

  it('onClose가 없으면 브라우저가 닫아도 다시 연다', () => {
    // given
    const dialog = renderModal();

    // when
    dialog.removeAttribute('open');
    fireEvent(dialog, new Event('close'));

    // then
    expect(dialog.hasAttribute('open')).toBe(true);
  });

  it('onClose가 있으면 바깥에서 누르고 떼면 닫힌다', () => {
    // given
    const handleClose = vi.fn();
    const dialog = renderModal(handleClose);

    // when
    fireEvent.pointerDown(dialog);
    fireEvent.pointerUp(dialog);
    fireEvent.click(dialog);

    // then
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('줄이지 않는 모달은 화면보다 커도 배율을 걸지 않고, 내용을 보이는 높이 안에서 스크롤한다', () => {
    // given
    vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(2000);
    vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(
      2000,
    );

    // when
    const dialog = renderModal();

    // then
    expect(dialog.style.transform).toBe('scale(1)');
    const content = screen.getByText('제목').parentElement;
    expect(content?.style.maxHeight).toBe(`${window.innerHeight - 32}px`);
  });
});
