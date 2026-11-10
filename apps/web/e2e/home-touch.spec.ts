import { test, expect } from '@playwright/test';

const TABLET_LANDSCAPE_VIEWPORT = { width: 1180, height: 820 };
const TOUCH_MOVE_STEPS = 20;
const TOUCH_MOVE_INTERVAL_MS = 16;

test.use({ viewport: TABLET_LANDSCAPE_VIEWPORT, hasTouch: true });

test.describe('홈 화면 터치 드래그', () => {
  test('터치로 토마토를 책상에 끌어 놓으면 방 선택 그룹이 열린다', async ({
    page,
    context,
  }) => {
    // given
    await page.goto('/');
    const tomatoBox = await page
      .getByRole('button', { name: '공부 시작' })
      .boundingBox();
    const tableBox = await page.getByTestId('table').boundingBox();
    if (!tomatoBox || !tableBox)
      throw new Error('토마토 또는 책상을 찾지 못했다');
    const from = {
      x: tomatoBox.x + tomatoBox.width / 2,
      y: tomatoBox.y + tomatoBox.height / 2,
    };
    const to = {
      x: tableBox.x + tableBox.width / 2,
      y: tableBox.y + tableBox.height / 2,
    };
    const cdp = await context.newCDPSession(page);

    // when
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [from],
    });
    for (let step = 1; step <= TOUCH_MOVE_STEPS; step++) {
      await cdp.send('Input.dispatchTouchEvent', {
        type: 'touchMove',
        touchPoints: [
          {
            x: from.x + ((to.x - from.x) * step) / TOUCH_MOVE_STEPS,
            y: from.y + ((to.y - from.y) * step) / TOUCH_MOVE_STEPS,
          },
        ],
      });
      await page.waitForTimeout(TOUCH_MOVE_INTERVAL_MS);
    }
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchEnd',
      touchPoints: [],
    });

    // then
    await expect(
      page.getByRole('group', { name: '어디서 공부할까요?' }),
    ).toBeVisible();
  });
});
