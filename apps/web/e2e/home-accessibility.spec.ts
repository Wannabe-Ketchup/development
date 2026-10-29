import { test, expect } from '@playwright/test';
import { mockCreateRoom } from './fixtures/api-mocks';

test.describe('홈 화면 접근성 흐름', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test.describe('H-A. 홈에 처음 도착해 공부를 시작한다', () => {
    test('홈 진입 시 "공부 시작" 버튼이 노출된다', async ({ page }) => {
      await expect(
        page.getByRole('button', { name: '공부 시작' }),
      ).toBeVisible();
    });

    test('공부 시작 후 "어디서 공부할까요?" 그룹의 첫 버튼이 포커스된다', async ({
      page,
    }) => {
      await page.getByRole('button', { name: '공부 시작' }).press('Space');
      const group = page.getByRole('group', { name: '어디서 공부할까요?' });
      await expect(group).toBeVisible();
      await expect(
        group.getByRole('button', { name: '새로운 방 만들기' }),
      ).toBeFocused();
    });
  });

  test.describe('H-B. 새로운 방을 만든다', () => {
    test('방 만들기 요청 중에는 버튼이 바쁨·비활성화 상태로 노출된다', async ({
      page,
    }) => {
      await mockCreateRoom(page, { pending: true });
      await page.getByRole('button', { name: '공부 시작' }).press('Space');
      await page.getByRole('button', { name: '새로운 방 만들기' }).click();
      const btn = page.getByRole('button', { name: '방 만드는 중...' });
      await expect(btn).toHaveAttribute('aria-busy', 'true');
      await expect(btn).toHaveAttribute('aria-disabled', 'true');
    });
  });

  test.describe('H-C. 초대 코드로 방에 입장한다', () => {
    test('초대 코드 입력 화면 진입 시 "초대 코드" 레이블로 input이 포커스된다', async ({
      page,
    }) => {
      await page.getByRole('button', { name: '공부 시작' }).press('Space');
      await page.getByRole('button', { name: '초대받은 방 입장하기' }).click();
      await expect(
        page.getByRole('textbox', { name: '초대 코드' }),
      ).toBeFocused();
    });
  });

  test.describe('H-D. 잘못된 초대 코드로 에러를 받는다', () => {
    test.beforeEach(async ({ page }) => {
      await page.getByRole('button', { name: '공부 시작' }).press('Space');
      await page.getByRole('button', { name: '초대받은 방 입장하기' }).click();
    });

    test('빈 값으로 입장 시도 시 input이 잘못된 상태가 되고 에러가 연결된다', async ({
      page,
    }) => {
      const input = page.getByRole('textbox', { name: '초대 코드' });
      await input.press('Enter');
      await expect(input).toHaveAttribute('aria-invalid', 'true');
      await expect(input).toHaveAttribute(
        'aria-describedby',
        'room-entry-error',
      );
      await expect(page.locator('#room-entry-error')).toHaveText(
        '초대 코드를 입력해 주세요.',
      );
    });

    test('입장하기 버튼 클릭으로 에러 발생 시 input으로 포커스가 복원된다', async ({
      page,
    }) => {
      await page.getByRole('button', { name: '입장하기' }).click();
      await expect(
        page.getByRole('textbox', { name: '초대 코드' }),
      ).toBeFocused();
    });
  });

  test.describe('H-E. 공부 준비를 취소한다', () => {
    test('방 선택 단계에서 Escape 시 공부 시작 버튼으로 포커스가 복귀된다', async ({
      page,
    }) => {
      await page.getByRole('button', { name: '공부 시작' }).press('Space');
      await page.keyboard.press('Escape');
      await expect(
        page.getByRole('button', { name: '공부 시작' }),
      ).toBeFocused();
    });

    test('초대 코드 입력 단계에서 Escape 시 공부 시작 버튼으로 포커스가 복귀된다', async ({
      page,
    }) => {
      await page.getByRole('button', { name: '공부 시작' }).press('Space');
      await page.getByRole('button', { name: '초대받은 방 입장하기' }).click();
      await page.keyboard.press('Escape');
      await expect(
        page.getByRole('button', { name: '공부 시작' }),
      ).toBeFocused();
    });
  });
});
