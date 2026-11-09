import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import type { Mock } from 'vitest';
import { RoomEntryPopover } from './RoomEntryPopover';
import { EnterRoomError, enterRoomByInviteCode } from '@/api/room';
import { goToRoom } from '@/lib/room-id';

const { mockShake } = vi.hoisted(() => ({ mockShake: vi.fn() }));

vi.mock('@/hooks/useShake', () => ({
  useShake: () => ({ ref: { current: null }, shake: mockShake }),
}));
vi.mock('@/api/room', async (importOriginal) => ({
  // EnterRoomError는 instanceof 판별에 쓰이므로 실제 클래스를 쓴다
  EnterRoomError: (await importOriginal<typeof import('@/api/room')>())
    .EnterRoomError,
  createRoom: vi.fn(),
  enterRoomByInviteCode: vi.fn(),
}));
vi.mock('@/lib/room-id');

const mockEnterRoomByInviteCode = enterRoomByInviteCode as unknown as Mock;

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

  it('공백만 입력하고 입장하면 입장 요청을 보내지 않고 초대 코드를 입력하라고 안내한다', () => {
    // given
    openInviteCodeInput();

    // when
    enterWithCode('   ');

    // then
    const expectedMessage = '초대 코드를 입력해 주세요.';
    expect(screen.getByText(expectedMessage)).toBeTruthy();
    expect(mockEnterRoomByInviteCode).not.toHaveBeenCalled();
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

  it('초대 코드로 입장하면 입장 응답의 방 ID로 이동한다', async () => {
    // given
    mockEnterRoomByInviteCode.mockResolvedValue({
      participant: { id: 'p-1', nickname: '졸린토마토' },
      room: { roomId: 'room-1' },
    });
    openInviteCodeInput();

    // when
    enterWithCode('K7P2QX');

    // then
    expect(mockEnterRoomByInviteCode).toHaveBeenCalledWith('K7P2QX');
    const expectedRoomId = 'room-1';
    await waitFor(() => expect(goToRoom).toHaveBeenCalledWith(expectedRoomId));
  });

  it('없는 초대 코드로 입장하면 에러 문구를 보여주고 흔들기를 요청하며 이동하지 않는다', async () => {
    // given
    mockEnterRoomByInviteCode.mockRejectedValue(
      new EnterRoomError('not-found', '방 입장에 실패했습니다.'),
    );
    openInviteCodeInput();

    // when
    enterWithCode('ZZZZZZ');

    // then
    const expectedMessage = '찾을 수 없는 방입니다.';
    const expectedShakeCount = 1;
    expect(await screen.findByText(expectedMessage)).toBeTruthy();
    expect(mockShake).toHaveBeenCalledTimes(expectedShakeCount);
    expect(goToRoom).not.toHaveBeenCalled();
  });

  it('정원이 찬 방에 입장하면 서버 안내 문구를 보여주고 흔들기를 요청하며 이동하지 않는다', async () => {
    // given
    const serverMessage = '방의 정원이 모두 찼습니다.';
    mockEnterRoomByInviteCode.mockRejectedValue(
      new EnterRoomError('rejected', serverMessage),
    );
    openInviteCodeInput();

    // when
    enterWithCode('K7P2QX');

    // then
    const expectedShakeCount = 1;
    expect(await screen.findByText(serverMessage)).toBeTruthy();
    expect(mockShake).toHaveBeenCalledTimes(expectedShakeCount);
    expect(goToRoom).not.toHaveBeenCalled();
  });

  it('방 입장에 실패하면 원인과 상관없이 재시도 안내를 보여주고 흔들기를 요청하며 이동하지 않는다', async () => {
    // given
    mockEnterRoomByInviteCode.mockRejectedValue(
      new SyntaxError('Unexpected token <'),
    );
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

  it('입장 요청 중에 다시 입장하면 입장 요청을 한 번만 보낸다', () => {
    // given
    mockEnterRoomByInviteCode.mockReturnValue(new Promise(() => {}));
    openInviteCodeInput();
    enterWithCode('room-1');

    // when
    fireEvent.click(screen.getByRole('button', { name: '입장하기' }));
    fireEvent.click(screen.getByRole('button', { name: '입장하기' }));

    // then
    const expectedRequestCount = 1;
    expect(mockEnterRoomByInviteCode).toHaveBeenCalledTimes(
      expectedRequestCount,
    );
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

  it('입장 요청 중에는 뒤로 갈 수 없다', () => {
    // given
    mockEnterRoomByInviteCode.mockReturnValue(new Promise(() => {}));
    openInviteCodeInput();
    enterWithCode('room-1');

    // when
    fireEvent.click(screen.getByRole('button', { name: '뒤로가기' }));

    // then
    const expectedPlaceholder = '초대 코드를 입력하세요';
    expect(screen.getByPlaceholderText(expectedPlaceholder)).toBeTruthy();
  });

  it('방 선택 화면에서 Escape를 누르면 토마토가 휴식을 취하는 상태로 돌아간다', () => {
    // given
    const handleClose = vi.fn();
    render(<RoomEntryPopover onClose={handleClose} />);
    const container = screen.getByText('어디서 공부할까요?').closest('div')!;

    // when
    fireEvent.keyDown(container, { key: 'Escape' });

    // then
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('초대 코드 입력 화면에서 Escape를 누르면 토마토가 휴식을 취하는 상태로 돌아간다', () => {
    // given
    const handleClose = vi.fn();
    render(<RoomEntryPopover onClose={handleClose} />);
    fireEvent.click(
      screen.getByRole('button', { name: '초대받은 방 입장하기' }),
    );

    // when
    fireEvent.keyDown(screen.getByPlaceholderText('초대 코드를 입력하세요'), {
      key: 'Escape',
    });

    // then
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('방 선택 화면이 열리면 첫 번째 버튼에 포커스가 이동한다', () => {
    // given / when
    render(<RoomEntryPopover />);

    // then
    expect(document.activeElement).toBe(
      screen.getByRole('button', { name: '새로운 방 만들기' }),
    );
  });
});
