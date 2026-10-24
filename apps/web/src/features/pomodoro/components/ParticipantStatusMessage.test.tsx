import { render, screen, fireEvent } from '@testing-library/react';
import type { Mock } from 'vitest';
import { ParticipantStatusMessage } from './ParticipantStatusMessage';
import { changeStatusMessage } from '@/api/room';

vi.mock('@/api/room');

const mockChangeStatusMessage = changeStatusMessage as unknown as Mock;

const BREAK_MESSAGE = '휴식 중…';

interface RenderOptions {
  message?: string;
  isSelf?: boolean;
  isBreak?: boolean;
}

const statusMessageElement = ({
  message = '공부중',
  isSelf = true,
  isBreak = false,
}: RenderOptions) => (
  <ParticipantStatusMessage
    roomId="room-1"
    message={message}
    isSelf={isSelf}
    isBreak={isBreak}
  />
);

const renderStatusMessage = (options: RenderOptions = {}) =>
  render(statusMessageElement(options));

describe('ParticipantStatusMessage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockChangeStatusMessage.mockResolvedValue(undefined);
  });

  it("휴식 중이면 상태 메시지 대신 '휴식 중…'을 보여 준다", () => {
    // given
    const message = '공부중';

    // when
    renderStatusMessage({ message, isBreak: true });

    // then
    expect(screen.getByText(BREAK_MESSAGE)).toBeTruthy();
    expect(screen.queryByText(message)).toBeNull();
  });

  it('휴식이 끝나면 원래 상태 메시지를 다시 보여 주고, 휴식 중에 바뀐 메시지가 있으면 바뀐 메시지를 보여 준다', () => {
    // given
    const { rerender } = renderStatusMessage({
      message: '공부중',
      isBreak: true,
    });

    // when
    rerender(statusMessageElement({ message: '밥먹는중', isBreak: false }));

    // then
    expect(screen.getByText('밥먹는중')).toBeTruthy();
    expect(screen.queryByText(BREAK_MESSAGE)).toBeNull();
  });

  it("휴식 중이면 상태 메시지가 비어 있는 다른 참여자에게도 '휴식 중…'을 보여 준다", () => {
    // given
    const message = '';

    // when
    renderStatusMessage({ message, isSelf: false, isBreak: true });

    // then
    expect(screen.getByText(BREAK_MESSAGE)).toBeTruthy();
  });

  it('휴식 중에는 자신의 상태 메시지를 고치는 버튼이 보이지 않는다', () => {
    // given
    const isBreak = true;

    // when
    renderStatusMessage({ isSelf: true, isBreak });

    // then
    expect(screen.getByText(BREAK_MESSAGE)).toBeTruthy();
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('고치는 중에 휴식이 시작되어도 입력하던 내용을 그대로 저장할 수 있다', () => {
    // given
    const { rerender } = renderStatusMessage({ message: '공부중' });
    fireEvent.click(screen.getByRole('button'));
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: '복습중' },
    });

    // when
    rerender(statusMessageElement({ message: '공부중', isBreak: true }));
    fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Enter' });

    // then
    expect(mockChangeStatusMessage).toHaveBeenCalledWith('room-1', '복습중');
    expect(mockChangeStatusMessage).not.toHaveBeenCalledWith(
      'room-1',
      BREAK_MESSAGE,
    );
  });
});
