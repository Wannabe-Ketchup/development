import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { findInviteCode } from '@/api/room';
import { InviteCodeModal } from './InviteCodeModal';

vi.mock('@/api/room');

function stubClipboard(writeText: () => Promise<void>) {
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText: vi.fn(writeText) },
    configurable: true,
  });
  return vi.mocked(navigator.clipboard.writeText);
}

describe('InviteCodeModal', () => {
  it("열리면 조회한 초대코드를 '초대코드' 다이얼로그에 보여 준다", async () => {
    // given
    vi.mocked(findInviteCode).mockResolvedValue({ inviteCode: 'ABC234' });

    // when
    render(<InviteCodeModal roomId="r1" onClose={() => {}} />);

    // then
    const dialog = screen.getByRole('dialog', { name: '초대코드' });
    expect(await screen.findByText('ABC234')).toBeTruthy();
    expect(dialog.contains(screen.getByText('ABC234'))).toBe(true);
  });

  it('초대코드 조회에 실패하면 불러오지 못했다고 안내한다', async () => {
    // given
    vi.mocked(findInviteCode).mockRejectedValue(new Error('fail'));

    // when
    render(<InviteCodeModal roomId="r1" onClose={() => {}} />);

    // then
    expect((await screen.findByRole('alert')).textContent).toBe(
      '초대코드를 불러오지 못했어요',
    );
  });

  it('닫기 버튼을 누르면 onClose가 호출된다', () => {
    // given
    vi.mocked(findInviteCode).mockResolvedValue({ inviteCode: 'ABC234' });
    const handleClose = vi.fn();
    render(<InviteCodeModal roomId="r1" onClose={handleClose} />);

    // when
    fireEvent.click(screen.getByRole('button', { name: '닫기' }));

    // then
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('다이얼로그 바깥을 누르면 닫히고 안쪽을 누르면 닫히지 않는다', () => {
    // given
    vi.mocked(findInviteCode).mockResolvedValue({ inviteCode: 'ABC234' });
    const handleClose = vi.fn();
    render(<InviteCodeModal roomId="r1" onClose={handleClose} />);
    const dialog = screen.getByRole('dialog', { name: '초대코드' });

    // when: 안쪽 누름
    const inner = screen.getByText('초대코드');
    fireEvent.pointerDown(inner);
    fireEvent.click(inner);

    // then
    expect(handleClose).not.toHaveBeenCalled();

    // when: 바깥(dialog 자신) 누름
    fireEvent.pointerDown(dialog);
    fireEvent.click(dialog);

    // then
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('안쪽에서 누른 채 바깥에서 떼면 닫히지 않는다', () => {
    // given
    vi.mocked(findInviteCode).mockResolvedValue({ inviteCode: 'ABC234' });
    const handleClose = vi.fn();
    render(<InviteCodeModal roomId="r1" onClose={handleClose} />);
    const dialog = screen.getByRole('dialog', { name: '초대코드' });

    // when: 안쪽에서 누르고 dialog 바깥에서 뗌
    fireEvent.pointerDown(screen.getByText('초대코드'));
    fireEvent.click(dialog);

    // then
    expect(handleClose).not.toHaveBeenCalled();
  });

  it('바깥에서 누른 채 안쪽에서 떼면 닫히지 않는다', () => {
    // given
    vi.mocked(findInviteCode).mockResolvedValue({ inviteCode: 'ABC234' });
    const handleClose = vi.fn();
    render(<InviteCodeModal roomId="r1" onClose={handleClose} />);
    const dialog = screen.getByRole('dialog', { name: '초대코드' });

    // when: dialog 바깥에서 누르고 안쪽에서 뗌 (click은 공통 조상인 dialog로 온다)
    fireEvent.pointerDown(dialog);
    fireEvent.pointerUp(screen.getByText('초대코드'));
    fireEvent.click(dialog);

    // then
    expect(handleClose).not.toHaveBeenCalled();
  });

  it('다이얼로그가 close 이벤트로 닫히면(Esc) onClose가 호출된다', () => {
    // given
    vi.mocked(findInviteCode).mockResolvedValue({ inviteCode: 'ABC234' });
    const handleClose = vi.fn();
    render(<InviteCodeModal roomId="r1" onClose={handleClose} />);
    const dialog = screen.getByRole('dialog', { name: '초대코드' });

    // when
    fireEvent(dialog, new Event('close'));

    // then
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  describe('코드 복사하기', () => {
    afterEach(() => {
      vi.useRealTimers();
      Reflect.deleteProperty(navigator, 'clipboard');
    });

    it('코드 복사하기를 누르면 초대코드만 클립보드에 복사하고 복사했다고 알린다', async () => {
      // given
      vi.mocked(findInviteCode).mockResolvedValue({ inviteCode: 'ABC234' });
      const writeText = stubClipboard(() => Promise.resolve());
      render(<InviteCodeModal roomId="r1" onClose={() => {}} />);
      await screen.findByText('ABC234');

      // when
      fireEvent.click(screen.getByRole('button', { name: '코드 복사하기' }));

      // then
      expect(
        await screen.findByRole('button', { name: '복사했어요!' }),
      ).toBeTruthy();
      expect(writeText).toHaveBeenCalledWith('ABC234');
      expect(screen.getByRole('status').textContent).toBe(
        '초대코드를 복사했어요',
      );
    });

    it('복사했다는 안내는 1.5초 뒤 원래 문구로 돌아간다', async () => {
      // given
      vi.mocked(findInviteCode).mockResolvedValue({ inviteCode: 'ABC234' });
      stubClipboard(() => Promise.resolve());
      render(<InviteCodeModal roomId="r1" onClose={() => {}} />);
      await screen.findByText('ABC234');
      vi.useFakeTimers();
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: '코드 복사하기' }));
      });
      expect(screen.getByRole('button', { name: '복사했어요!' })).toBeTruthy();

      // when
      await act(async () => {
        await vi.advanceTimersByTimeAsync(1500);
      });

      // then
      expect(
        screen.getByRole('button', { name: '코드 복사하기' }),
      ).toBeTruthy();
      expect(screen.getByRole('status').textContent).toBe('');
    });

    it('1.5초 안에 다시 복사하면 마지막 복사로부터 1.5초 뒤에 원래 문구로 돌아간다', async () => {
      // given
      vi.mocked(findInviteCode).mockResolvedValue({ inviteCode: 'ABC234' });
      stubClipboard(() => Promise.resolve());
      render(<InviteCodeModal roomId="r1" onClose={() => {}} />);
      await screen.findByText('ABC234');
      vi.useFakeTimers();
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: '코드 복사하기' }));
      });
      await act(async () => {
        await vi.advanceTimersByTimeAsync(1000);
      });

      // when: 1초 뒤 다시 복사하고 다시 1초가 지남
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: '복사했어요!' }));
      });
      await act(async () => {
        await vi.advanceTimersByTimeAsync(1000);
      });

      // then: 첫 복사로부터는 1.5초가 넘게 지났지만 아직 안내 중
      expect(screen.getByRole('button', { name: '복사했어요!' })).toBeTruthy();

      // when: 마지막 복사로부터 1.5초가 지남
      await act(async () => {
        await vi.advanceTimersByTimeAsync(500);
      });

      // then
      expect(
        screen.getByRole('button', { name: '코드 복사하기' }),
      ).toBeTruthy();
    });

    it('복사하지 못했다는 안내도 1.5초 뒤 원래 문구로 돌아간다', async () => {
      // given
      vi.mocked(findInviteCode).mockResolvedValue({ inviteCode: 'ABC234' });
      stubClipboard(() => Promise.reject(new Error('denied')));
      render(<InviteCodeModal roomId="r1" onClose={() => {}} />);
      await screen.findByText('ABC234');
      vi.useFakeTimers();
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: '코드 복사하기' }));
      });
      expect(
        screen.getByRole('button', { name: '복사하지 못했어요' }),
      ).toBeTruthy();

      // when
      await act(async () => {
        await vi.advanceTimersByTimeAsync(1500);
      });

      // then
      expect(
        screen.getByRole('button', { name: '코드 복사하기' }),
      ).toBeTruthy();
      expect(screen.getByRole('status').textContent).toBe('');
    });

    it('클립보드에 쓰지 못하면 복사하지 못했다고 알린다', async () => {
      // given
      vi.mocked(findInviteCode).mockResolvedValue({ inviteCode: 'ABC234' });
      stubClipboard(() => Promise.reject(new Error('denied')));
      render(<InviteCodeModal roomId="r1" onClose={() => {}} />);
      await screen.findByText('ABC234');

      // when
      fireEvent.click(screen.getByRole('button', { name: '코드 복사하기' }));

      // then
      expect(
        await screen.findByRole('button', { name: '복사하지 못했어요' }),
      ).toBeTruthy();
      expect(screen.getByRole('status').textContent).toBe(
        '초대코드를 복사하지 못했어요',
      );
    });

    it('초대코드를 불러오기 전에는 복사 버튼을 누를 수 없다', () => {
      // given
      vi.mocked(findInviteCode).mockReturnValue(new Promise(() => {}));

      // when
      render(<InviteCodeModal roomId="r1" onClose={() => {}} />);

      // then
      const button = screen.getByRole<HTMLButtonElement>('button', {
        name: '코드 복사하기',
      });
      expect(button.disabled).toBe(true);
    });

    it('초대코드를 불러오지 못하면 복사 버튼을 누를 수 없다', async () => {
      // given
      vi.mocked(findInviteCode).mockRejectedValue(new Error('fail'));

      // when
      render(<InviteCodeModal roomId="r1" onClose={() => {}} />);
      await screen.findByRole('alert');

      // then
      const button = screen.getByRole<HTMLButtonElement>('button', {
        name: '코드 복사하기',
      });
      expect(button.disabled).toBe(true);
    });
  });
});
