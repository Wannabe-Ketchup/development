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
});
