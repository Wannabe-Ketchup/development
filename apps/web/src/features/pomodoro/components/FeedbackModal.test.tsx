import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { submitFeedback, SubmitFeedbackError } from '@/api/feedback';
import { FeedbackModal } from './FeedbackModal';

vi.mock('@/api/feedback', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/api/feedback')>()),
  submitFeedback: vi.fn(),
}));

const PLACEHOLDER = '어떤 점이 좋았고 어떤 점이 불편했는지 적어주세요';

function typeContent(value: string) {
  fireEvent.change(screen.getByPlaceholderText(PLACEHOLDER), {
    target: { value },
  });
}

describe('FeedbackModal', () => {
  it.each([{ content: '' }, { content: '   \n ' }])(
    '내용이 비었거나 공백만 있으면($content) 전송하기 버튼이 비활성화된다',
    ({ content }) => {
      // given
      render(<FeedbackModal onClose={() => {}} />);

      // when
      typeContent(content);

      // then
      const button = screen.getByRole('button', { name: '전송하기' });
      expect((button as HTMLButtonElement).disabled).toBe(true);
    },
  );

  it('전송 중에는 전송하기를 다시 눌러도 요청이 한 번만 나가고 Esc로 닫히지 않는다', async () => {
    // given
    vi.mocked(submitFeedback).mockReturnValue(new Promise(() => {}));
    const handleClose = vi.fn();
    render(<FeedbackModal onClose={handleClose} />);
    typeContent('좋아요');

    // when
    fireEvent.click(screen.getByRole('button', { name: '전송하기' }));
    const sendingButton = await screen.findByRole('button', {
      name: '전송 중',
    });
    fireEvent.click(sendingButton);
    fireEvent(
      screen.getByRole('dialog'),
      new Event('cancel', { cancelable: true }),
    );

    // then
    expect(submitFeedback).toHaveBeenCalledTimes(1);
    expect(handleClose).not.toHaveBeenCalled();
  });

  it('전송에 실패하면 입력한 내용과 첨부가 그대로 남는다', async () => {
    // given
    vi.mocked(submitFeedback).mockRejectedValue(
      new SubmitFeedbackError('unavailable'),
    );
    render(<FeedbackModal onClose={() => {}} />);
    typeContent('불편해요');
    fireEvent.change(screen.getByTestId('feedback-file-input'), {
      target: { files: [new File(['a'], 'shot.png')] },
    });

    // when
    fireEvent.click(screen.getByRole('button', { name: '전송하기' }));

    // then
    await waitFor(() => expect(screen.getByRole('alert')).toBeTruthy());
    expect(
      (screen.getByPlaceholderText(PLACEHOLDER) as HTMLTextAreaElement).value,
    ).toBe('불편해요');
    expect(screen.getByRole('button', { name: 'shot.png 빼기' })).toBeTruthy();
  });
});
