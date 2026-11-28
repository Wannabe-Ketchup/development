import { test, expect } from '@playwright/test';

test.describe('홈 반응형 말풍선', () => {
  test('화면 배치가 바뀌어도 초대 코드와 포커스가 유지된다', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 393, height: 852 });
    await page.goto('/');
    await page.getByRole('button', { name: '공부 시작' }).press('Enter');
    await page.getByRole('button', { name: '초대받은 방 입장하기' }).click();
    const input = page.getByPlaceholder('초대 코드를 입력하세요');
    await input.fill('ABC123');

    for (const size of [
      { width: 852, height: 393, layout: 'landscape' },
      { width: 1024, height: 768, layout: 'medium' },
      { width: 1440, height: 900, layout: 'desktop' },
      { width: 393, height: 852, layout: 'portrait' },
    ]) {
      await page.setViewportSize({ width: size.width, height: size.height });
      await expect(page.getByRole('main')).toHaveAttribute(
        'data-layout',
        size.layout,
      );
      await expect(input).toHaveValue('ABC123');
      await expect(input).toBeFocused();
    }

    // Android처럼 키보드가 레이아웃 높이를 줄여도 세로 배치를 유지한다.
    await page.setViewportSize({ width: 393, height: 300 });
    await expect(page.getByRole('main')).toHaveAttribute(
      'data-layout',
      'portrait',
    );
    await expect
      .poll(async () => (await input.boundingBox())?.y)
      .toBeGreaterThanOrEqual(12);
    await expect
      .poll(async () => {
        const box = await input.boundingBox();
        return box ? box.y + box.height : Infinity;
      })
      .toBeLessThan(300);
  });

  test('가로 휴대폰의 왼쪽 말풍선과 오류 문구가 화면 안에 놓인다', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 667, height: 375 });
    await page.goto('/');
    await page.getByRole('button', { name: '공부 시작' }).press('Enter');
    const group = page.getByRole('group', { name: '어디서 공부할까요?' });
    await expect(group).toBeVisible();
    const table = await page.getByTestId('table').boundingBox();
    await expect
      .poll(async () => {
        const box = await group.boundingBox();
        return box ? box.x + box.width : Infinity;
      })
      // 토마토는 테이블 가운데에 앉아 있다. 말풍선은 그 왼쪽에 뜬다
      .toBeLessThan(table!.x + table!.width / 2);

    await page.getByRole('button', { name: '초대받은 방 입장하기' }).click();
    await page.getByPlaceholder('초대 코드를 입력하세요').press('Enter');
    const error = page.getByRole('alert');
    await expect(error).toHaveText('초대 코드를 입력해 주세요.');
    await expect
      .poll(async () => (await error.boundingBox())?.y)
      .toBeGreaterThanOrEqual(12);
    const submit = page.getByRole('button', { name: '입장하기', exact: true });
    await expect
      .poll(async () => {
        const box = await submit.boundingBox();
        return box ? box.y + box.height : Infinity;
      })
      .toBeLessThan(375);
  });

  test('세로 배치에서 입력 오류 문구가 소파와 겹치지 않는다', async ({
    page,
  }) => {
    // given
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.getByRole('button', { name: '공부 시작' }).press('Enter');
    await page.getByRole('button', { name: '초대받은 방 입장하기' }).click();

    // when
    await page.getByPlaceholder('초대 코드를 입력하세요').press('Enter');

    // then
    const error = page.getByRole('alert');
    await expect(error).toHaveText('초대 코드를 입력해 주세요.');
    const sofa = await page.getByTestId('sofa').boundingBox();
    await expect
      .poll(async () => (await error.boundingBox())?.y)
      .toBeGreaterThanOrEqual(sofa!.y + sofa!.height);
  });
});
