import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import type { Mock } from 'vitest';
import { RoomEntryPopover } from './RoomEntryPopover';
import { existsRoom } from '@/api/room';
import { goToRoom } from '@/lib/room-id';

const { mockShake } = vi.hoisted(() => ({ mockShake: vi.fn() }));

vi.mock('@/hooks/useShake', () => ({
  useShake: () => ({ ref: { current: null }, shake: mockShake }),
}));
vi.mock('@/api/room');
vi.mock('@/lib/room-id');

const mockExistsRoom = existsRoom as unknown as Mock;

const openInviteCodeInput = () => {
  render(<RoomEntryPopover />);
  fireEvent.click(screen.getByRole('button', { name: '초대받은 방 입장하기' }));
};

const enterWithCode = (code: string) => {
  fireEvent.change(screen.getByPlaceholderText('초대 코드를 입력하세요'), {
    target: { value: code },
  });
  fireEvent.click(screen.getByRole('button', { name: '입장하기' }));
};

describe('RoomEntryPopover', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('에러 문구가 표시된 상태에서 빈 값으로 다시 입장하면 흔들기를 다시 요청한다', () => {
    // given
    openInviteCodeInput();
    const enterButton = screen.getByRole('button', { name: '입장하기' });
    fireEvent.click(enterButton);

    // when
    fireEvent.click(enterButton);

    // then
    const expectedShakeCount = 2;
    expect(mockShake).toHaveBeenCalledTimes(expectedShakeCount);
  });

  it('입력창에서 Enter를 여러 번 누르면 누를 때마다 흔들기를 요청한다', () => {
    // given
    openInviteCodeInput();
    const input = screen.getByPlaceholderText('초대 코드를 입력하세요');

    // when
    fireEvent.keyDown(input, { key: 'Enter' });
    fireEvent.keyDown(input, { key: 'Enter' });
    fireEvent.keyDown(input, { key: 'Enter' });

    // then
    const expectedShakeCount = 3;
    expect(mockShake).toHaveBeenCalledTimes(expectedShakeCount);
  });

  it('존재하는 방 코드로 입장하면 그 방으로 이동한다', async () => {
    // given
    mockExistsRoom.mockResolvedValue({ exists: true });
    openInviteCodeInput();

    // when
    enterWithCode('room-1');

    // then
    const expectedRoomId = 'room-1';
    await waitFor(() => expect(goToRoom).toHaveBeenCalledWith(expectedRoomId));
  });

  it('존재하지 않는 방 코드로 입장하면 에러 문구를 보여주고 흔들기를 요청하며 이동하지 않는다', async () => {
    // given
    mockExistsRoom.mockResolvedValue({ exists: false });
    openInviteCodeInput();

    // when
    enterWithCode('unknown-room');

    // then
    const expectedMessage = '찾을 수 없는 방입니다.';
    const expectedShakeCount = 1;
    expect(await screen.findByText(expectedMessage)).toBeTruthy();
    expect(mockShake).toHaveBeenCalledTimes(expectedShakeCount);
    expect(goToRoom).not.toHaveBeenCalled();
  });

  it('방 확인에 실패하면 원인과 상관없이 재시도 안내를 보여주고 흔들기를 요청하며 이동하지 않는다', async () => {
    // given
    mockExistsRoom.mockRejectedValue(new SyntaxError('Unexpected token <'));
    openInviteCodeInput();

    // when
    enterWithCode('room-1');

    // then
    const expectedMessage = '잠시 후 다시 시도해 주세요.';
    const expectedShakeCount = 1;
    expect(await screen.findByText(expectedMessage)).toBeTruthy();
    expect(mockShake).toHaveBeenCalledTimes(expectedShakeCount);
    expect(goToRoom).not.toHaveBeenCalled();
  });

  it('방을 확인하는 중에 다시 입장하면 확인 요청을 한 번만 보낸다', () => {
    // given
    mockExistsRoom.mockReturnValue(new Promise(() => {}));
    openInviteCodeInput();
    enterWithCode('room-1');

    // when
    fireEvent.click(screen.getByRole('button', { name: '입장하기' }));
    fireEvent.click(screen.getByRole('button', { name: '입장하기' }));

    // then
    const expectedRequestCount = 1;
    expect(mockExistsRoom).toHaveBeenCalledTimes(expectedRequestCount);
  });

  it('초대 코드 입력 화면에서 뒤로 가면 선택지 화면으로 돌아간다', () => {
    // given
    openInviteCodeInput();

    // when
    fireEvent.click(screen.getByRole('button', { name: '뒤로가기' }));

    // then
    const expectedTitle = '어디서 공부할까요?';
    expect(screen.getByText(expectedTitle)).toBeTruthy();
  });

  it('입력창에서 Escape를 누르면 선택지 화면으로 돌아간다', () => {
    // given
    openInviteCodeInput();

    // when
    fireEvent.keyDown(screen.getByPlaceholderText('초대 코드를 입력하세요'), {
      key: 'Escape',
    });

    // then
    const expectedTitle = '어디서 공부할까요?';
    expect(screen.getByText(expectedTitle)).toBeTruthy();
  });

  it('에러 문구가 표시된 상태에서 뒤로 가면 에러 문구가 사라진다', () => {
    // given
    openInviteCodeInput();
    fireEvent.click(screen.getByRole('button', { name: '입장하기' }));

    // when
    fireEvent.click(screen.getByRole('button', { name: '뒤로가기' }));

    // then
    const clearedMessage = '초대 코드를 입력해 주세요.';
    expect(screen.queryByText(clearedMessage)).toBeNull();
  });

  it('뒤로 갔다가 다시 들어오면 입력했던 초대 코드가 남아 있다', () => {
    // given
    openInviteCodeInput();
    fireEvent.change(screen.getByPlaceholderText('초대 코드를 입력하세요'), {
      target: { value: 'room-1' },
    });
    fireEvent.click(screen.getByRole('button', { name: '뒤로가기' }));

    // when
    fireEvent.click(
      screen.getByRole('button', { name: '초대받은 방 입장하기' }),
    );

    // then
    const expectedCode = 'room-1';
    expect(screen.getByDisplayValue(expectedCode)).toBeTruthy();
  });

  it('방을 확인하는 중에는 뒤로 갈 수 없다', () => {
    // given
    mockExistsRoom.mockReturnValue(new Promise(() => {}));
    openInviteCodeInput();
    enterWithCode('room-1');

    // when
    fireEvent.click(screen.getByRole('button', { name: '뒤로가기' }));

    // then
    const expectedPlaceholder = '초대 코드를 입력하세요';
    expect(screen.getByPlaceholderText(expectedPlaceholder)).toBeTruthy();
  });
});
