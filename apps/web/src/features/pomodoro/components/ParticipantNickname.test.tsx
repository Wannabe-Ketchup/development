import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import type { Mock } from 'vitest';
import { ParticipantNickname } from './ParticipantNickname';
import { changeNickname } from '@/api/room';

vi.mock('@/api/room');

const mockChangeNickname = changeNickname as unknown as Mock;

const renderNickname = (nickname = '토마토') =>
  render(
    <ParticipantNickname
      roomId="room-1"
      participantId="p-1"
      nickname={nickname}
    />,
  );

const startEditing = () =>
  fireEvent.click(screen.getByRole('button', { name: '닉네임 수정' }));

describe('ParticipantNickname', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockChangeNickname.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('자신의 닉네임을 화면에서 확인할 수 있다', () => {
    // given
    const nickname = '토마토';

    // when
    renderNickname(nickname);

    // then
    const expectedNickname = '토마토';
    expect(screen.getByText(expectedNickname)).toBeTruthy();
  });

  it('수정 버튼을 누르면 닉네임을 고칠 수 있는 상태가 된다', () => {
    // given
    renderNickname();

    // when
    startEditing();

    // then
    expect(screen.getByRole('textbox')).toBeTruthy();
  });

  it('수정을 시작하면 쓰던 닉네임이 입력되어 있어 일부만 고칠 수 있다', () => {
    // given
    renderNickname('토마토');

    // when
    startEditing();

    // then
    const expectedValue = '토마토';
    expect(screen.getByRole<HTMLInputElement>('textbox').value).toBe(
      expectedValue,
    );
  });

  it('수정을 시작하면 따로 클릭하지 않아도 바로 입력할 수 있다', () => {
    // given
    renderNickname();

    // when
    startEditing();

    // then
    const expectedFocusedElement = screen.getByRole('textbox');
    expect(document.activeElement).toBe(expectedFocusedElement);
  });

  it('수정 중에는 변경을 확정할 수 있는 버튼이 보인다', () => {
    // given
    renderNickname();

    // when
    startEditing();

    // then
    expect(screen.getByRole('button', { name: '닉네임 확인' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: '닉네임 수정' })).toBeNull();
  });

  it('Enter를 누르면 입력한 닉네임으로 변경되고 수정이 끝난다', () => {
    // given
    renderNickname('토마토');
    startEditing();
    const input = screen.getByRole('textbox');
    const newNickname = '케첩';

    // when
    fireEvent.change(input, { target: { value: newNickname } });
    fireEvent.keyDown(input, { key: 'Enter' });

    // then
    expect(mockChangeNickname).toHaveBeenCalledWith('room-1', 'p-1', '케첩');
    expect(screen.queryByRole('textbox')).toBeNull();
  });

  it('확인 버튼을 누르면 입력한 닉네임으로 변경되고 수정이 끝난다', () => {
    // given
    renderNickname('토마토');
    startEditing();
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: '케첩' },
    });

    // when
    fireEvent.click(screen.getByRole('button', { name: '닉네임 확인' }));

    // then
    expect(mockChangeNickname).toHaveBeenCalledWith('room-1', 'p-1', '케첩');
    expect(screen.queryByRole('textbox')).toBeNull();
  });

  it('서버 응답을 기다리지 않고 입력한 닉네임을 보여준다', () => {
    // given
    mockChangeNickname.mockReturnValue(new Promise(() => {}));
    renderNickname('토마토');
    startEditing();
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: '케첩' },
    });

    // when
    fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Enter' });

    // then
    const expectedNickname = '케첩';
    expect(screen.getByText(expectedNickname)).toBeTruthy();
  });

  it('현재 닉네임과 같은 값으로 확정하면 서버에 요청하지 않는다', () => {
    // given
    renderNickname('토마토');
    startEditing();

    // when
    fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Enter' });

    // then
    expect(mockChangeNickname).not.toHaveBeenCalled();
  });

  it('확인 버튼을 누르는 동안 입력창에서 포커스가 빠져나가지 않는다', () => {
    // given
    renderNickname();
    startEditing();
    const confirmButton = screen.getByRole('button', { name: '닉네임 확인' });

    // when
    const focusKeptOnInput = fireEvent.mouseDown(confirmButton) === false;

    // then
    const expectedFocusKept = true;
    expect(focusKeptOnInput).toBe(expectedFocusKept);
  });

  it('Escape를 누르면 수정이 취소되고 원래 닉네임이 유지된다', () => {
    // given
    renderNickname('토마토');
    startEditing();
    const input = screen.getByRole('textbox');

    // when
    fireEvent.change(input, { target: { value: '케첩' } });
    fireEvent.keyDown(input, { key: 'Escape' });

    // then
    const expectedNickname = '토마토';
    expect(mockChangeNickname).not.toHaveBeenCalled();
    expect(screen.getByText(expectedNickname)).toBeTruthy();
  });

  it('수정 도중 화면의 다른 곳을 클릭하면 변경이 취소되고 원래 닉네임이 유지된다', () => {
    // given
    renderNickname('토마토');
    startEditing();
    const input = screen.getByRole('textbox');
    vi.spyOn(document, 'hasFocus').mockReturnValue(true);

    // when
    fireEvent.change(input, { target: { value: '케첩' } });
    fireEvent.blur(input);

    // then
    const expectedNickname = '토마토';
    expect(mockChangeNickname).not.toHaveBeenCalled();
    expect(screen.getByText(expectedNickname)).toBeTruthy();
  });

  it('수정 도중 다른 창으로 전환해도 입력하던 내용이 그대로 남아있다', () => {
    // given
    renderNickname('토마토');
    startEditing();
    const input = screen.getByRole('textbox');
    vi.spyOn(document, 'hasFocus').mockReturnValue(false);

    // when
    fireEvent.change(input, { target: { value: '케첩' } });
    fireEvent.blur(input);

    // then
    const expectedValue = '케첩';
    expect(screen.getByRole<HTMLInputElement>('textbox').value).toBe(
      expectedValue,
    );
  });

  it('닉네임 변경이 거절되면 거절 사유를 알려준다', async () => {
    // given
    mockChangeNickname.mockRejectedValue(
      new Error('이미 사용 중인 닉네임입니다.'),
    );
    renderNickname('토마토');
    startEditing();
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: '케첩' },
    });

    // when
    await act(async () => {
      fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Enter' });
    });

    // then
    const expectedMessage = '이미 사용 중인 닉네임입니다.';
    await waitFor(() =>
      expect(screen.getByRole('alert').textContent).toBe(expectedMessage),
    );
  });

  it('닉네임 변경이 거절되면 거절된 닉네임을 그대로 고칠 수 있다', async () => {
    // given
    mockChangeNickname.mockRejectedValue(
      new Error('이미 사용 중인 닉네임입니다.'),
    );
    renderNickname('토마토');
    startEditing();
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: '케첩' },
    });

    // when
    await act(async () => {
      fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Enter' });
    });

    // then
    const expectedValue = '케첩';
    await waitFor(() =>
      expect(screen.getByRole<HTMLInputElement>('textbox').value).toBe(
        expectedValue,
      ),
    );
  });

  it('닉네임 변경이 거절되면 수정 중인 영역이 거절을 알리는 색으로 표시된다', async () => {
    // given
    mockChangeNickname.mockRejectedValue(
      new Error('이미 사용 중인 닉네임입니다.'),
    );
    renderNickname('토마토');
    startEditing();
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: '케첩' },
    });

    // when
    await act(async () => {
      fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Enter' });
    });

    // then
    await waitFor(() => {
      const editArea = screen.getByRole('textbox').parentElement as HTMLElement;
      expect(editArea.className).toContain('border-error');
      expect(editArea.className).toContain('animate-shake');
    });
  });

  it('거절된 뒤 수정을 취소하면 서버가 인정한 닉네임으로 돌아간다', async () => {
    // given
    mockChangeNickname.mockRejectedValue(
      new Error('이미 사용 중인 닉네임입니다.'),
    );
    renderNickname('토마토');
    startEditing();
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: '케첩' },
    });
    await act(async () => {
      fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Enter' });
    });

    // when
    fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Escape' });

    // then
    const expectedNickname = '토마토';
    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.getByText(expectedNickname)).toBeTruthy();
  });
});
