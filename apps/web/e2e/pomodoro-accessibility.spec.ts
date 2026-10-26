import { test, expect } from '@playwright/test';
import {
  mockRoomWith,
  mockEnterRoomOnly,
  mockRoomWithSSEConnected,
} from './fixtures/api-mocks';

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

  test.describe('P-D. How to use 투어로 사용법을 익힌다', () => {
    test('How to use 버튼을 통해 투어가 열리고 첫 활성 버튼에 포커스가 놓인다', async ({
      page,
    }) => {
      // given: SSE 연결 완료 상태 (canShowTour=true)
      await mockRoomWithSSEConnected(page);
      await page.goto('/pomodoro?roomId=r1');

      const triggerBtn = page.getByRole('button', { name: 'how to use' });
      await expect(triggerBtn).toBeVisible();

      // when: 트리거 버튼 클릭
      await triggerBtn.click();

      // then: dialog가 열리고 "다음" 버튼(첫 활성 버튼)에 포커스가 놓인다
      const dialog = page.getByRole('dialog', { name: '뽀모도로 사용법' });
      await expect(dialog).toBeVisible();
      await expect(triggerBtn).toHaveAttribute('aria-expanded', 'true');
      const nextBtn = page.getByRole('button', { name: '다음' });
      await expect(nextBtn).toBeFocused();
    });

    test('Escape 키로 투어가 닫히고 트리거 버튼으로 포커스가 복원된다', async ({
      page,
    }) => {
      // given: 투어가 열린 상태
      await mockRoomWithSSEConnected(page);
      await page.goto('/pomodoro?roomId=r1');
      const triggerBtn = page.getByRole('button', { name: 'how to use' });
      await expect(triggerBtn).toBeVisible();
      await triggerBtn.click();
      const dialog = page.getByRole('dialog', { name: '뽀모도로 사용법' });
      await expect(dialog).toBeVisible();

      // when: Escape 키 입력
      await page.keyboard.press('Escape');

      // then: dialog가 닫히고 트리거 버튼으로 포커스 복원, aria-expanded=false
      await expect(dialog).not.toBeVisible();
      await expect(triggerBtn).toBeFocused();
      await expect(triggerBtn).toHaveAttribute('aria-expanded', 'false');
    });

    test('오버레이 바깥을 클릭하면 투어가 닫히고 트리거로 포커스가 복원된다', async ({
      page,
    }) => {
      // given: 투어가 열린 상태
      await mockRoomWithSSEConnected(page);
      await page.goto('/pomodoro?roomId=r1');
      const triggerBtn = page.getByRole('button', { name: 'how to use' });
      await expect(triggerBtn).toBeVisible();
      await triggerBtn.click();
      const dialog = page.getByRole('dialog', { name: '뽀모도로 사용법' });
      await expect(dialog).toBeVisible();

      // when: 오버레이 바깥(화면 우상단) 클릭
      await page.mouse.click(10, 10);

      // then: dialog가 닫히고 트리거 버튼으로 포커스 복원
      await expect(dialog).not.toBeVisible();
      await expect(triggerBtn).toBeFocused();
    });

    test('하이라이트된 영역 안의 버튼은 클릭할 수 있고 투어는 열린 채로 유지된다', async ({
      page,
    }) => {
      // given: 닉네임 스텝(4단계)이 열린 상태
      await mockRoomWithSSEConnected(page);
      await page.goto('/pomodoro?roomId=r1');
      await page.getByRole('button', { name: 'how to use' }).click();
      const dialog = page.getByRole('dialog', { name: '뽀모도로 사용법' });
      await expect(dialog).toBeVisible();
      for (let i = 0; i < 3; i++) {
        await page.getByRole('button', { name: '다음' }).click();
      }
      await expect(page.getByText('4/6단계')).toBeVisible();

      // when: 하이라이트된 닉네임의 수정 버튼을 클릭
      await page.getByRole('button', { name: '닉네임 수정' }).click();

      // then: 오버레이에 막히지 않고 편집 모드로 들어가며, 투어는 닫히지 않는다
      await expect(
        page.getByRole('textbox', { name: '닉네임 입력' }),
      ).toBeVisible();
      await expect(dialog).toBeVisible();
    });

    test('하이라이트된 입력 필드에서 Escape를 누르면 편집만 취소되고 투어는 유지된다', async ({
      page,
    }) => {
      // given: 닉네임 편집 중인 4단계
      await mockRoomWithSSEConnected(page);
      await page.goto('/pomodoro?roomId=r1');
      await page.getByRole('button', { name: 'how to use' }).click();
      const dialog = page.getByRole('dialog', { name: '뽀모도로 사용법' });
      await expect(dialog).toBeVisible();
      for (let i = 0; i < 3; i++) {
        await page.getByRole('button', { name: '다음' }).click();
      }
      await page.getByRole('button', { name: '닉네임 수정' }).click();
      const input = page.getByRole('textbox', { name: '닉네임 입력' });
      await expect(input).toBeFocused();

      // when
      await page.keyboard.press('Escape');

      // then: 편집은 취소되고 투어는 그대로 열려 있다
      await expect(input).not.toBeVisible();
      await expect(dialog).toBeVisible();
    });

    test('다음/이전 버튼으로 6개 스텝을 순차 이동하고 설명·스텝 번호가 변경된다', async ({
      page,
    }) => {
      // given: 투어 열기
      await mockRoomWithSSEConnected(page);
      await page.goto('/pomodoro?roomId=r1');
      const triggerBtn = page.getByRole('button', { name: 'how to use' });
      await expect(triggerBtn).toBeVisible();
      await triggerBtn.click();
      await expect(
        page.getByRole('dialog', { name: '뽀모도로 사용법' }),
      ).toBeVisible();

      // when/then: 1→2→3→4→5→6 순차 이동 확인
      // exact: true를 사용해 aria-live 영역("6단계 중 N단계. {설명}")과 실제 <p> 요소를 구분한다.
      await expect(page.getByText('1/6단계')).toBeVisible();
      await expect(
        page.getByText(
          '시작·중지 버튼으로 타이머를 조작하고, 남은 시간과 현재 세션을 확인할 수 있어요.',
          { exact: true },
        ),
      ).toBeVisible();

      await page.getByRole('button', { name: '다음' }).click();
      await expect(page.getByText('2/6단계')).toBeVisible();
      await expect(
        page.getByText(
          '함께 공부하는 사람들을 확인할 수 있어요. 토마토 색상은 완료한 세션 수를, 노트북과 커피는 각 참가자의 집중·휴식 상태를 나타내요.',
          { exact: true },
        ),
      ).toBeVisible();

      await page.getByRole('button', { name: '다음' }).click();
      await expect(page.getByText('3/6단계')).toBeVisible();

      await page.getByRole('button', { name: '다음' }).click();
      await expect(page.getByText('4/6단계')).toBeVisible();

      await page.getByRole('button', { name: '다음' }).click();
      await expect(page.getByText('5/6단계')).toBeVisible();

      await page.getByRole('button', { name: '다음' }).click();
      await expect(page.getByText('6/6단계')).toBeVisible();

      // 이전 버튼으로 되돌아가기
      await page.getByRole('button', { name: '이전' }).click();
      await expect(page.getByText('5/6단계')).toBeVisible();
    });

    test('첫 스텝 "이전" / 마지막 스텝 "다음"이 비활성화되고 Tab이 비활성 버튼을 건너뛴다', async ({
      page,
    }) => {
      // given: 투어 열기 (1단계)
      await mockRoomWithSSEConnected(page);
      await page.goto('/pomodoro?roomId=r1');
      const triggerBtn = page.getByRole('button', { name: 'how to use' });
      await expect(triggerBtn).toBeVisible();
      await triggerBtn.click();
      await expect(
        page.getByRole('dialog', { name: '뽀모도로 사용법' }),
      ).toBeVisible();

      // then: 첫 스텝 "이전" 버튼은 disabled
      const prevBtn = page.getByRole('button', { name: '이전' });
      await expect(prevBtn).toBeDisabled();

      // then: Tab 이동 — 첫 스텝에서 "다음" → "닫기" (disabled "이전"은 건너뜀). 비모달이라 포커스를 가두지 않는다.
      const nextBtn = page.getByRole('button', { name: '다음' });
      const closeBtn = page.getByRole('button', { name: '닫기' });
      // 투어가 열리고 일정 시간 뒤 "다음"으로 자동 포커스가 이동한다. 그 이동이 끝나기 전에 Tab을 누르면 경합하므로 먼저 기다린다.
      await expect(nextBtn).toBeFocused();
      await page.keyboard.press('Tab');
      await expect(closeBtn).toBeFocused();
      await page.keyboard.press('Shift+Tab');
      await expect(nextBtn).toBeFocused();

      // when: 마지막 스텝으로 이동 (5회 다음 클릭)
      for (let i = 0; i < 5; i++) {
        await nextBtn.click();
      }
      await expect(page.getByText('6/6단계')).toBeVisible();

      // then: 마지막 스텝 "다음" 버튼은 disabled
      await expect(nextBtn).toBeDisabled();

      // then: 마지막 스텝 Tab 이동 — "이전" → "닫기" (disabled "다음"은 건너뜀)
      // 마지막 스텝에서는 자동 포커스가 "닫기"로 이동한다. 그 이동이 끝난 뒤에 시작해야 경합하지 않는다.
      await expect(closeBtn).toBeFocused();
      await prevBtn.focus();
      await page.keyboard.press('Tab');
      await expect(closeBtn).toBeFocused();
    });

    test('`aria-live` 영역이 스텝 전환 시 "6단계 중 N단계. {설명}" 형식으로 재공표된다', async ({
      page,
    }) => {
      // given: 투어 열기
      await mockRoomWithSSEConnected(page);
      await page.goto('/pomodoro?roomId=r1');
      const triggerBtn = page.getByRole('button', { name: 'how to use' });
      await expect(triggerBtn).toBeVisible();
      await triggerBtn.click();
      await expect(
        page.getByRole('dialog', { name: '뽀모도로 사용법' }),
      ).toBeVisible();

      // then: 1단계 aria-live 텍스트 확인
      const liveRegion = page.locator(
        '[aria-live="polite"][aria-atomic="true"]',
      );
      await expect(liveRegion).toContainText(
        '6단계 중 1단계. 시작·중지 버튼으로 타이머를 조작하고, 남은 시간과 현재 세션을 확인할 수 있어요.',
      );

      // when: 다음 클릭
      await page.getByRole('button', { name: '다음' }).click();

      // then: 2단계 aria-live 텍스트로 교체
      await expect(liveRegion).toContainText(
        '6단계 중 2단계. 함께 공부하는 사람들을 확인할 수 있어요. 토마토 색상은 완료한 세션 수를, 노트북과 커피는 각 참가자의 집중·휴식 상태를 나타내요.',
      );
    });

    test('SSE 에러가 발생하면 열려 있던 투어가 자동으로 닫히고 에러 오버레이가 노출된다', async ({
      page,
    }) => {
      // given: SSE 연결 완료 상태로 시작해 투어를 연다
      // mockRoomWithSSEConnected는 FakeSSEEventSource를 주입한다.
      // window.__triggerSSEError()로 onerror를 직접 발화시켜 sseStatus='error'로 전환한다.
      await mockRoomWithSSEConnected(page);
      await page.goto('/pomodoro?roomId=r1');
      const triggerBtn = page.getByRole('button', { name: 'how to use' });
      await expect(triggerBtn).toBeVisible();
      await triggerBtn.click();
      const dialog = page.getByRole('dialog', { name: '뽀모도로 사용법' });
      await expect(dialog).toBeVisible();

      // when: FakeSSEEventSource의 onerror를 직접 발화 → sseStatus='error' 전환
      await page.evaluate(() => {
        (window as unknown as Record<string, () => void>).__triggerSSEError?.();
      });

      // then: sseStatus='error' 전환 →
      //       sse-error 오버레이가 노출되고 투어 dialog가 자동으로 닫힌다
      const sseError = page.getByTestId('sse-error');
      await expect(sseError).toBeVisible({ timeout: 5000 });
      await expect(dialog).not.toBeVisible();
    });

    test('SSE 연결 완료 전에는 How to use 버튼이 접근성 트리에 노출되지 않는다', async ({
      page,
    }) => {
      // given: SSE가 hanging 상태(연결만 됐고 room_state 이벤트 미수신 → isConfirmed=false)
      await mockEnterRoomOnly(page);
      await page.goto('/pomodoro?roomId=r1');

      // then: How to use 버튼이 DOM에 없어야 한다
      const triggerBtn = page.getByRole('button', { name: 'how to use' });
      await expect(triggerBtn).not.toBeAttached();
    });
  });
});
