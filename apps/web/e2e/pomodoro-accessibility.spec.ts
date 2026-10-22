import { test, expect } from '@playwright/test';
import { mockRoomWith, mockEnterRoomOnly } from './fixtures/api-mocks';

test.describe('뽀모도로 화면 접근성 흐름', () => {
  test.describe('P-A. 참가자 목록 탐색', () => {
    test.beforeEach(async ({ page }) => {
      await mockRoomWith(page, {
        self: { nickname: '토마토1', statusMessage: '' },
        others: [
          { nickname: '토마토2', statusMessage: '열심히!' },
          { nickname: '토마토3', statusMessage: '' },
        ],
      });
      await page.goto('/pomodoro?roomId=r1');
    });

    test('참가자 목록 리스트는 "참가자 목록" 레이블로 노출되고 항목 수가 맞다', async ({
      page,
    }) => {
      const list = page.getByRole('list', { name: '참가자 목록' });
      await expect(list.getByRole('listitem')).toHaveCount(3);
    });

    test('본인 리스트 항목은 "나,"로 시작하는 접근 가능한 이름을 가진다', async ({
      page,
    }) => {
      const list = page.getByRole('list', { name: '참가자 목록' });
      await expect(list.getByRole('listitem').first()).toHaveAccessibleName(
        /^나,/,
      );
    });

    test('타인의 빈 상태 메시지는 접근성 트리에 노출되지 않는다', async ({
      page,
    }) => {
      const list = page.getByRole('list', { name: '참가자 목록' });
      const otherEmptyItem = list.getByRole('listitem').nth(2);
      await expect(otherEmptyItem).toBeAttached();
      await expect(otherEmptyItem).not.toContainText('지금 무엇을');
    });

    test('타인의 리스트 항목에는 수정 버튼이 노출되지 않는다', async ({
      page,
    }) => {
      const list = page.getByRole('list', { name: '참가자 목록' });
      const otherItem1 = list.getByRole('listitem').nth(1);
      const otherItem2 = list.getByRole('listitem').nth(2);
      await expect(otherItem1.getByRole('button')).toHaveCount(0);
      await expect(otherItem2.getByRole('button')).toHaveCount(0);
    });

    test('본인 상태 메시지가 비어있을 때 수정 버튼이 포커스로 접근 가능하다', async ({
      page,
    }) => {
      const btn = page.getByRole('button', { name: '상태 메시지 수정' });
      await btn.focus();
      const opacity = await btn.evaluate((el) => getComputedStyle(el).opacity);
      expect(opacity).toBe('1');
    });

    test('참가자 리스트 접근성 트리가 기준 스냅샷과 일치한다', async ({
      page,
    }) => {
      await expect(
        page
          .getByRole('list', { name: '참가자 목록' })
          .getByRole('listitem')
          .first(),
      ).toBeAttached();
      const snap = await page
        .locator('[aria-label="참가자 목록"]')
        .ariaSnapshot();
      expect(snap).toMatchSnapshot('pomodoro-participants.txt');
    });
  });

  test.describe('P-B. 음악 재생/중지', () => {
    test.beforeEach(async ({ page }) => {
      await mockEnterRoomOnly(page);
      await page.goto('/pomodoro?roomId=r1');
    });

    test('LP 플레이어는 재생·중지 토글에 따라 버튼 레이블이 바뀐다', async ({
      page,
    }) => {
      const play = page.getByRole('button', { name: '음악 재생' });
      await expect(play).toBeVisible();
      await play.click();
      await expect(
        page.getByRole('button', { name: '음악 중지' }),
      ).toBeVisible();
    });

    test('재생 중 음표 애니메이션은 접근성 트리에 노출되지 않는다', async ({
      page,
    }) => {
      await page.getByRole('button', { name: '음악 재생' }).click();
      await page.getByRole('button', { name: '음악 중지' }).waitFor();
      const snap = await page.locator('body').ariaSnapshot();
      expect(snap).not.toContain('note');
    });
  });

  test.describe('P-C. 조명(테마) 전환', () => {
    test.beforeEach(async ({ page }) => {
      await mockEnterRoomOnly(page);
      await page.goto('/pomodoro?roomId=r1');
    });

    test('조명 버튼 레이블은 현재 상태에서의 다음 전환 동작을 반영한다', async ({
      page,
    }) => {
      const btn = page.getByRole('button', { name: /모드로 전환/ });
      await expect(btn).toBeVisible();
      const before = await btn.getAttribute('aria-label');
      await btn.dispatchEvent('click');
      await expect(btn).not.toHaveAttribute('aria-label', before!);
      const after = await btn.getAttribute('aria-label');
      expect(after).toMatch(/모드로 전환/);
    });
  });
});
