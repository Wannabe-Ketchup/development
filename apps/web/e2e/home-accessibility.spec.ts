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

  test.describe('H-F. 사용 설명서를 읽는다', () => {
    test('사용 설명서를 열면 dialog가 열리고 첫 장이 펼쳐지며 "1 / 5"를 알린다', async ({
      page,
    }) => {
      await page.getByRole('button', { name: '사용 설명서' }).press('Enter');
      const dialog = page.getByRole('dialog', {
        name: '워너비케챱 사용 설명서',
      });
      await expect(dialog).toBeVisible();
      await expect(dialog.locator('[aria-live="polite"]')).toHaveText(
        '1 / 5, 차례',
      );
      await expect(dialog.locator(':focus')).toHaveCount(1);
    });

    test('방향키·책갈피로 마지막 장(FAQ)까지 읽으면 "다음 장"이 비활성화된다', async ({
      page,
    }) => {
      await page.getByRole('button', { name: '사용 설명서' }).press('Enter');
      const dialog = page.getByRole('dialog', {
        name: '워너비케챱 사용 설명서',
      });
      const indicator = dialog.locator('[aria-live="polite"]');
      await expect(indicator).toHaveText('1 / 5, 차례');
      // 넘기는 동안(650ms)의 입력은 버려지므로 첫 장이 조작 가능해질 때까지 기다린다
      await expect(dialog.locator('h1:not([inert] *)')).toBeVisible();

      await page.keyboard.press('ArrowRight');
      await expect(indicator).toHaveText('2 / 5, 뽀모도로란?');
      await expect(
        dialog.locator('h2:not([inert] *)', { hasText: '뽀모도로란?' }),
      ).toBeVisible();

      const faqBookmark = dialog.getByRole('button', { name: 'FAQ' });
      await faqBookmark.press('Enter');
      await expect(indicator).toHaveText('5 / 5, 자주 묻는 질문');
      await expect(faqBookmark).toHaveAttribute('aria-current', 'true');
      await expect(
        dialog.getByRole('heading', { name: '자주 묻는 질문' }),
      ).toBeFocused();
      await expect(
        dialog.locator('h2:not([inert] *)', { hasText: '자주 묻는 질문' }),
      ).toBeVisible();
      await expect(
        dialog.getByRole('button', { name: '다음 장' }),
      ).toBeDisabled();
    });

    test('사용 설명서를 연 뒤 Escape를 누르면 dialog가 닫히고 포커스가 열기 버튼으로 돌아온다', async ({
      page,
    }) => {
      await page.getByRole('button', { name: '사용 설명서' }).press('Enter');
      const dialog = page.getByRole('dialog', {
        name: '워너비케챱 사용 설명서',
      });
      await expect(dialog).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(dialog).toBeHidden();
      await expect(
        page.getByRole('button', { name: '사용 설명서' }),
      ).toBeFocused();
    });

    test('방 선택 그룹이 열려 있을 때 사용 설명서를 열면 방 선택 그룹이 닫힌다', async ({
      page,
    }) => {
      await page.getByRole('button', { name: '공부 시작' }).press('Space');
      const group = page.getByRole('group', { name: '어디서 공부할까요?' });
      await expect(group).toBeVisible();
      await page.getByRole('button', { name: '사용 설명서' }).click();
      await expect(
        page.getByRole('dialog', { name: '워너비케챱 사용 설명서' }),
      ).toBeVisible();
      await expect(group).toBeHidden();
    });
  });

  test.describe('H-G. 개인정보처리방침을 연다', () => {
    test('개인정보처리방침 링크는 /privacy.html을 새 탭으로 열고 Tab으로 포커스할 수 있다', async ({
      page,
    }) => {
      const link = page.getByRole('link', { name: '개인정보처리방침' });
      await expect(link).toHaveAttribute('href', '/privacy.html');
      await expect(link).toHaveAttribute('target', '_blank');

      await page.getByRole('button', { name: '사용 설명서' }).focus();
      await page.keyboard.press('Tab');
      await expect(link).toBeFocused();

      const popupPromise = page.waitForEvent('popup');
      await page.keyboard.press('Enter');
      const popup = await popupPromise;
      await expect(popup).toHaveURL(/\/privacy\.html$/);
      await expect(page).toHaveURL('/');
    });
  });
});
