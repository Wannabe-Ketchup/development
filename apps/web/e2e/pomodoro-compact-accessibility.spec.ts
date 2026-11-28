import { test, expect } from '@playwright/test';
import {
  mockRoomWithSSEConnected,
  mockChatMessage,
  emitSseEvent,
} from './fixtures/api-mocks';

// 좁은 화면(playwright.config.ts의 compact-mobile 393×852, compact-tablet 1024×1366)에서만 돈다.
// 본인(self-p1)이 3명 중 2번째인 방이다
const THREE_PARTICIPANTS = [
  {
    id: 'other-p2',
    nickname: '토마토2',
    statusMessage: '',
    completedCycles: 1,
  },
  { id: 'self-p1', nickname: '토마토1', statusMessage: '', completedCycles: 1 },
  {
    id: 'other-p3',
    nickname: '토마토3',
    statusMessage: '',
    completedCycles: 1,
  },
];

test.describe('뽀모도로 좁은 화면 접근성 흐름', () => {
  test.describe('P-J. 휴대폰 화면에서 참여자를 넘겨 본다', () => {
    test.skip(
      ({ viewport }) => viewport?.width !== 393,
      '참여자 넘김은 휴대폰 화면(393×852)만 있다',
    );

    test('본인에서 시작해 끝까지 넘기고 처음 쪽으로 돌아온다', async ({
      page,
    }) => {
      // given
      await mockRoomWithSSEConnected(page, {
        roomOverrides: { participants: THREE_PARTICIPANTS },
      });
      const nextBtn = page.getByRole('button', { name: '다음 참여자' });
      const prevBtn = page.getByRole('button', { name: '이전 참여자' });

      // when: 단계 1
      await page.goto('/pomodoro/r1');

      // then
      await expect(page.getByText('3명 중 2번째, 나')).toBeAttached();
      await expect(
        page.getByRole('button', { name: '닉네임 수정' }),
      ).toBeVisible();

      // when: 단계 2
      await nextBtn.focus();
      await page.keyboard.press('Enter');

      // then
      await expect(page.getByText('3명 중 3번째, 토마토3')).toBeAttached();
      await expect(
        page.getByRole('button', { name: '닉네임 수정' }),
      ).toHaveCount(0);
      await expect(
        page.getByRole('button', { name: '상태 메시지 수정' }),
      ).toHaveCount(0);

      // then: 단계 3
      await expect(nextBtn).toBeDisabled();

      // when: 단계 4
      await prevBtn.focus();
      await page.keyboard.press('Enter');
      await page.keyboard.press('Enter');

      // then
      await expect(page.getByText('3명 중 1번째, 토마토2')).toBeAttached();
      await expect(prevBtn).toBeDisabled();
    });
  });

  test.describe('P-K. 좁은 화면에서 채팅 창을 열어 메시지를 보낸다', () => {
    test('열어서 보낸 뒤 닫으면 열기 버튼으로 포커스가 돌아오고, 다시 열면 쓰던 내용이 남아 있다', async ({
      page,
    }) => {
      // given
      await mockRoomWithSSEConnected(page, {
        roomOverrides: { participants: THREE_PARTICIPANTS },
      });
      await mockChatMessage(page);
      await page.goto('/pomodoro/r1');
      const openBtn = page.getByRole('button', { name: /^chat/ });
      const dialog = page.getByRole('dialog', { name: '채팅' });
      const textbox = page.getByRole('textbox', { name: '메시지' });
      const items = page.getByRole('log').getByRole('listitem');
      await expect(openBtn).toBeVisible();
      await emitSseEvent(page, 'chat_history', { messages: [] });

      // when: 단계 1
      await emitSseEvent(page, 'chat_message', {
        id: 1,
        senderId: 'other-p2',
        nickname: '토마토2',
        content: '안녕하세요',
        sentAt: new Date(2026, 0, 1, 14, 3).toISOString(),
      });

      // then
      await expect(openBtn).toHaveAccessibleName('chat 안 읽은 메시지 있음');

      // when: 단계 2
      await openBtn.focus();
      await page.keyboard.press('Enter');

      // then
      await expect(dialog).toBeVisible();
      await expect(textbox).toBeFocused();
      await expect(items).toHaveCount(1);

      // when: 단계 3
      await page.keyboard.type('다들 화이팅');
      await page.keyboard.press('Enter');

      // then
      await expect(items).toHaveCount(2);
      await expect(items.last()).toContainText('다들 화이팅');
      await expect(textbox).toHaveValue('');

      // when: 단계 4
      await page.keyboard.type('쓰던 내용');
      await dialog.getByRole('button', { name: '채팅 닫기' }).focus();
      await page.keyboard.press('Enter');

      // then
      await expect(dialog).toBeHidden();
      await expect(openBtn).toBeFocused();
      await expect(openBtn).toHaveAccessibleName('chat');

      // when: 단계 5
      await page.keyboard.press('Enter');

      // then
      await expect(dialog).toBeVisible();
      await expect(textbox).toHaveValue('쓰던 내용');
    });
  });

  test.describe('P-L. 좁은 화면에서 사용 안내 5단계를 본다', () => {
    test('상단 ?로 열어 5단계를 넘기고 Escape로 닫으면 ?로 포커스가 돌아온다', async ({
      page,
    }) => {
      // given
      await mockRoomWithSSEConnected(page);
      await page.goto('/pomodoro/r1');
      const triggerBtn = page.getByRole('button', { name: 'how to use' });
      const dialog = page.getByRole('dialog', { name: '뽀모도로 사용법' });
      const liveRegion = page.locator(
        '[aria-live="polite"][aria-atomic="true"]',
      );
      await expect(triggerBtn).toBeVisible();

      // when: 단계 1
      await triggerBtn.focus();
      await page.keyboard.press('Enter');

      // then
      await expect(dialog).toBeVisible();
      await expect(page.getByText('1/5단계')).toBeVisible();
      await expect(liveRegion).toContainText(
        '5단계 중 1단계. 시작·중지 버튼으로 타이머를 조작하고,',
      );

      // when: 단계 2
      const nextBtn = page.getByRole('button', { name: '다음' });
      await expect(nextBtn).toBeFocused();
      for (const step of [2, 3, 4, 5]) {
        await page.keyboard.press('Enter');
        await expect(page.getByText(`${step}/5단계`)).toBeVisible();
      }

      // then: 마지막 단계는 채팅이고 조명·LP 단계는 없다
      await expect(
        page.getByText('같은 방 사람들과 메시지를 주고받을 수 있어요.', {
          exact: true,
        }),
      ).toBeVisible();
      await expect(page.getByText('/6단계')).toHaveCount(0);

      // when: 단계 3
      await page.keyboard.press('Escape');

      // then
      await expect(dialog).toBeHidden();
      await expect(triggerBtn).toBeFocused();
    });

    test('투어가 열린 채 채팅을 열면 투어는 사라지고 포커스가 메시지 입력으로 간다', async ({
      page,
    }) => {
      // given: 투어가 열린 상태
      await mockRoomWithSSEConnected(page);
      await page.goto('/pomodoro/r1');
      await page.getByRole('button', { name: 'how to use' }).click();
      const tourDialog = page.getByRole('dialog', { name: '뽀모도로 사용법' });
      await expect(tourDialog).toBeVisible();

      // when
      await page.getByRole('button', { name: 'chat' }).focus();
      await page.keyboard.press('Enter');

      // then
      await expect(page.getByRole('dialog', { name: '채팅' })).toBeVisible();
      await expect(tourDialog).not.toBeVisible();
      await expect(page.getByRole('textbox', { name: '메시지' })).toBeFocused();
    });
  });
});
