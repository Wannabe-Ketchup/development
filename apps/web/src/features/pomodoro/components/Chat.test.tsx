import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import type { ChatMessage } from '@pomodoro/shared';
import { sendChatMessage, SendChatMessageError } from '@/api/chat';
import { Chat } from './Chat';

vi.mock('@/api/chat', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/api/chat')>()),
  sendChatMessage: vi.fn(),
}));

const mockSendChatMessage = vi.mocked(sendChatMessage);

const SELF_ID = 'participant-self';

const otherMessage: ChatMessage = {
  id: 1,
  senderId: 'participant-other',
  nickname: '나는쿠리만쥬',
  content: '안녕하세요',
  sentAt: new Date(2026, 0, 1, 14, 3).toISOString(),
};
const myMessage: ChatMessage = {
  id: 2,
  senderId: SELF_ID,
  nickname: '치이카와',
  content: '다들 화이팅',
  sentAt: new Date(2026, 0, 1, 14, 4).toISOString(),
};

function renderChat(messages: ChatMessage[] = []) {
  const onSent = vi.fn();
  render(
    <Chat
      roomId="room-1"
      selfParticipantId={SELF_ID}
      messages={messages}
      onSent={onSent}
    />,
  );
  return { onSent };
}

function openChat() {
  fireEvent.click(screen.getByRole('button', { name: 'chat' }));
}

function getInput() {
  return screen.getByRole<HTMLInputElement>('textbox', { name: '메시지' });
}

function typeMessage(content: string) {
  fireEvent.change(getInput(), { target: { value: content } });
}

function submitMessage() {
  const button = screen.getByRole('button', { name: '보내기' });
  // 실제 클릭은 버튼으로 포커스를 옮기지만 fireEvent는 옮기지 않는다
  button.focus();
  fireEvent.click(button);
}

describe('Chat', () => {
  beforeEach(() => {
    mockSendChatMessage.mockReset();
  });

  it('처음에는 닫혀 있다', () => {
    renderChat([otherMessage]);

    expect(screen.getByRole('button', { name: 'chat' })).toBeTruthy();
    expect(screen.queryByRole('region', { name: '채팅' })).toBeNull();
    expect(document.activeElement).toBe(document.body);
  });

  it('열면 채팅창이 보이고 입력창에 포커스가 간다', () => {
    // given
    renderChat();

    // when
    openChat();

    // then
    expect(screen.getByRole('region', { name: '채팅' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'chat' })).toBeNull();
    expect(document.activeElement).toBe(getInput());
  });

  it('다른 사람의 메시지는 닉네임, 내 메시지는 "나"로 보낸 시각과 함께 보인다', () => {
    // given
    renderChat([otherMessage, myMessage]);

    // when
    openChat();

    // then
    const [other, mine] = screen.getAllByRole('listitem');
    expect(within(other).getByText('나는쿠리만쥬')).toBeTruthy();
    expect(within(other).getByText('14:03')).toBeTruthy();
    expect(within(other).getByText('안녕하세요')).toBeTruthy();
    expect(within(mine).getByText('나')).toBeTruthy();
    expect(within(mine).queryByText('치이카와')).toBeNull();
    expect(within(mine).getByText('14:04')).toBeTruthy();
  });

  it.each([
    {
      name: '닫기 버튼',
      close: () =>
        fireEvent.click(screen.getByRole('button', { name: '채팅 닫기' })),
    },
    {
      name: 'Esc',
      close: () => fireEvent.keyDown(getInput(), { key: 'Escape' }),
    },
  ])('$name로 닫으면 열기 버튼으로 포커스가 돌아간다', ({ close }) => {
    // given
    renderChat();
    openChat();

    // when
    close();

    // then
    expect(screen.queryByRole('region', { name: '채팅' })).toBeNull();
    expect(document.activeElement).toBe(
      screen.getByRole('button', { name: 'chat' }),
    );
  });

  it('한글을 조합하는 중의 Esc로는 닫히지 않는다', () => {
    // given
    renderChat();
    openChat();

    // when
    fireEvent.keyDown(getInput(), { key: 'Escape', isComposing: true });

    // then
    expect(screen.getByRole('region', { name: '채팅' })).toBeTruthy();
  });

  // 다시 만들면 squiggle 테두리가 한 프레임 늦게 그려져 깜빡인다
  it('닫았다 열어도 채팅창을 새로 만들지 않는다', () => {
    // given
    renderChat();
    openChat();
    const inputBeforeClose = getInput();

    // when
    fireEvent.click(screen.getByRole('button', { name: '채팅 닫기' }));
    openChat();

    // then
    expect(getInput()).toBe(inputBeforeClose);
  });

  it('닫았다 열어도 쓰던 내용이 남아 있다', () => {
    // given
    renderChat();
    openChat();
    typeMessage('쓰던 내용');

    // when
    fireEvent.click(screen.getByRole('button', { name: '채팅 닫기' }));
    openChat();

    // then
    expect(getInput().value).toBe('쓰던 내용');
  });

  it('보내면 저장된 메시지를 넘기고 입력창을 비운 채 포커스를 유지한다', async () => {
    // given
    mockSendChatMessage.mockResolvedValue(myMessage);
    const { onSent } = renderChat();
    openChat();
    typeMessage('다들 화이팅');

    // when
    submitMessage();

    // then
    await vi.waitFor(() => expect(getInput().value).toBe(''));
    expect(onSent).toHaveBeenCalledWith(myMessage);
    expect(document.activeElement).toBe(getInput());
  });

  it('공백만 있으면 보내기를 누를 수 없다', () => {
    // given
    renderChat();
    openChat();

    // when
    typeMessage('   ');

    // then
    const button = screen.getByRole<HTMLButtonElement>('button', {
      name: '보내기',
    });
    expect(button.disabled).toBe(true);
  });

  it('입력은 100자까지만 받는다', () => {
    renderChat();
    openChat();

    expect(getInput().maxLength).toBe(100);
  });

  it.each([
    {
      reason: 'rate-limited',
      notice: '너무 자주 보냈어요. 잠시 후 다시 보내 주세요',
    },
    { reason: 'unknown', notice: '보내지 못했어요. 다시 시도해 주세요' },
  ] as const)(
    '$reason으로 보내지 못하면 입력을 그대로 두고 안내한다',
    async ({ reason, notice }) => {
      // given
      mockSendChatMessage.mockRejectedValue(new SendChatMessageError(reason));
      renderChat();
      openChat();
      typeMessage('다들 화이팅');

      // when
      submitMessage();

      // then
      const alert = await screen.findByRole('alert');
      expect(alert.textContent).toBe(notice);
      expect(getInput().value).toBe('다들 화이팅');
    },
  );
});
