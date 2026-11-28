import { fireEvent, render, screen } from '@testing-library/react';
import { FeedbackAttachmentField } from './FeedbackAttachmentField';

function renderField(files: File[] = [], disabled = false) {
  const openSpy = vi
    .spyOn(HTMLInputElement.prototype, 'click')
    .mockImplementation(() => {});
  const onFilesChange = vi.fn();
  render(
    <FeedbackAttachmentField
      files={files}
      disabled={disabled}
      boxClassName=""
      onFilesChange={onFilesChange}
    />,
  );
  const box = screen.getByRole('button', { name: /사진, 동영상 첨부/ })
    .parentElement as HTMLElement;
  return { openSpy, onFilesChange, box };
}

describe('FeedbackAttachmentField', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('첨부 상자의 첫 줄은 "최대 18MB"까지 한 버튼이라 어디를 눌러도 파일 선택 창이 열린다', () => {
    // given
    const { openSpy } = renderField();

    // when
    fireEvent.click(screen.getByText(/최대 \d+MB/));

    // then
    expect(openSpy).toHaveBeenCalledTimes(1);
  });

  it('첨부 칩을 누르면 파일 선택 창이 열리지 않는다', () => {
    // given
    const file = new File(['png'], 'shot.png', { type: 'image/png' });
    const { openSpy } = renderField([file]);

    // when
    fireEvent.click(screen.getByText('shot.png'));

    // then
    expect(openSpy).not.toHaveBeenCalled();
  });

  it('첨부 상자에 파일을 끌어다 놓으면 기존 첨부 뒤에 추가된다', () => {
    // given
    const existing = new File(['png'], 'a.png', { type: 'image/png' });
    const dropped = new File(['mp4'], 'b.mp4', { type: 'video/mp4' });
    const { onFilesChange, box } = renderField([existing]);

    // when
    fireEvent.drop(box, { dataTransfer: { files: [dropped] } });

    // then
    expect(onFilesChange).toHaveBeenCalledWith([existing, dropped]);
  });

  it('허용하지 않는 확장자를 끌어다 놓으면 추가하지 않고 안내한다', () => {
    // given
    const dropped = new File(['svg'], 'icon.svg', { type: 'image/svg+xml' });
    const { onFilesChange, box } = renderField();

    // when
    fireEvent.drop(box, { dataTransfer: { files: [dropped] } });

    // then
    expect(onFilesChange).not.toHaveBeenCalled();
    expect(screen.queryByRole('alert')).not.toBeNull();
  });

  it('전송 중에는 끌어다 놓아도 추가되지 않는다', () => {
    // given
    const dropped = new File(['png'], 'a.png', { type: 'image/png' });
    const { onFilesChange, box } = renderField([], true);

    // when
    fireEvent.drop(box, { dataTransfer: { files: [dropped] } });

    // then
    expect(onFilesChange).not.toHaveBeenCalled();
  });
});
