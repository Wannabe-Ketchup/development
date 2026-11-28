import { test, expect } from '@playwright/test';
import {
  mockRoomWith,
  mockEnterRoomOnly,
  mockRoomWithSSEConnected,
  mockTimerDuration,
  mockTimerAction,
  mockChatMessage,
  emitSseEvent,
} from './fixtures/api-mocks';

test.describe('뽀모도로 화면 접근성 흐름', () => {
  test.describe('P-A. 참가자 목록 탐색', () => {
    test.beforeEach(async ({ page }) => {
      await mockRoomWith(page, {
        self: { nickname: '토마토1', statusMessage: '' },
        others: [
          { nickname: '토마토2', statusMessage: '열심히!' },
          { nickname: ' ', statusMessage: '' },
        ],
      });
      await page.goto('/pomodoro/r1');
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

    test('공백만 있는 닉네임 참가자 listitem의 접근 가능한 이름은 "이름 없음"이다', async ({
      page,
    }) => {
      const list = page.getByRole('list', { name: '참가자 목록' });
      await expect(list.getByRole('listitem').nth(2)).toHaveAccessibleName(
        '이름 없음',
      );
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
      await page.goto('/pomodoro/r1');
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
      await page.goto('/pomodoro/r1');
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
      await page.goto('/pomodoro/r1');

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
      await page.goto('/pomodoro/r1');
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
      await page.goto('/pomodoro/r1');
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
      await page.goto('/pomodoro/r1');
      await page.getByRole('button', { name: 'how to use' }).click();
      const dialog = page.getByRole('dialog', { name: '뽀모도로 사용법' });
      await expect(dialog).toBeVisible();
      for (let i = 0; i < 3; i++) {
        await page.getByRole('button', { name: '다음' }).click();
      }
      await expect(page.getByText('4/7단계')).toBeVisible();

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
      await page.goto('/pomodoro/r1');
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

    test('다음/이전 버튼으로 7개 스텝을 순차 이동하고 설명·스텝 번호가 변경된다', async ({
      page,
    }) => {
      // given: 투어 열기
      await mockRoomWithSSEConnected(page);
      await page.goto('/pomodoro/r1');
      const triggerBtn = page.getByRole('button', { name: 'how to use' });
      await expect(triggerBtn).toBeVisible();
      await triggerBtn.click();
      await expect(
        page.getByRole('dialog', { name: '뽀모도로 사용법' }),
      ).toBeVisible();

      // when/then: 1→2→3→4→5→6 순차 이동 확인
      // exact: true를 사용해 aria-live 영역("7단계 중 N단계. {설명}")과 실제 <p> 요소를 구분한다.
      await expect(page.getByText('1/7단계')).toBeVisible();
      await expect(
        page.getByText(
          '시작·중지 버튼으로 타이머를 조작하고, 남은 시간과 현재 세션을 확인할 수 있어요.',
          { exact: true },
        ),
      ).toBeVisible();

      await page.getByRole('button', { name: '다음' }).click();
      await expect(page.getByText('2/7단계')).toBeVisible();
      await expect(
        page.getByText(
          '함께 공부하는 사람들을 확인할 수 있어요. 토마토 색상은 완료한 세션 수를, 노트북과 커피는 각 참가자의 집중·휴식 상태를 나타내요.',
          { exact: true },
        ),
      ).toBeVisible();

      await page.getByRole('button', { name: '다음' }).click();
      await expect(page.getByText('3/7단계')).toBeVisible();

      await page.getByRole('button', { name: '다음' }).click();
      await expect(page.getByText('4/7단계')).toBeVisible();

      await page.getByRole('button', { name: '다음' }).click();
      await expect(page.getByText('5/7단계')).toBeVisible();

      await page.getByRole('button', { name: '다음' }).click();
      await expect(page.getByText('6/7단계')).toBeVisible();

      await page.getByRole('button', { name: '다음' }).click();
      await expect(page.getByText('7/7단계')).toBeVisible();
      await expect(
        page.getByText('같은 방 사람들과 메시지를 주고받을 수 있어요.', {
          exact: true,
        }),
      ).toBeVisible();

      // 이전 버튼으로 되돌아가기
      await page.getByRole('button', { name: '이전' }).click();
      await expect(page.getByText('6/7단계')).toBeVisible();
    });

    test('첫 스텝 "이전" / 마지막 스텝 "다음"이 비활성화되고 Tab이 비활성 버튼을 건너뛴다', async ({
      page,
    }) => {
      // given: 투어 열기 (1단계)
      await mockRoomWithSSEConnected(page);
      await page.goto('/pomodoro/r1');
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

      // when: 마지막 스텝으로 이동 (6회 다음 클릭)
      for (let i = 0; i < 6; i++) {
        await nextBtn.click();
      }
      await expect(page.getByText('7/7단계')).toBeVisible();

      // then: 마지막 스텝 "다음" 버튼은 disabled
      await expect(nextBtn).toBeDisabled();

      // then: 마지막 스텝 Tab 이동 — "이전" → "닫기" (disabled "다음"은 건너뜀)
      // 마지막 스텝에서는 자동 포커스가 "닫기"로 이동한다. 그 이동이 끝난 뒤에 시작해야 경합하지 않는다.
      await expect(closeBtn).toBeFocused();
      await prevBtn.focus();
      await page.keyboard.press('Tab');
      await expect(closeBtn).toBeFocused();
    });

    test('`aria-live` 영역이 스텝 전환 시 "7단계 중 N단계. {설명}" 형식으로 재공표된다', async ({
      page,
    }) => {
      // given: 투어 열기
      await mockRoomWithSSEConnected(page);
      await page.goto('/pomodoro/r1');
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
        '7단계 중 1단계. 시작·중지 버튼으로 타이머를 조작하고, 남은 시간과 현재 세션을 확인할 수 있어요.',
      );

      // when: 다음 클릭
      await page.getByRole('button', { name: '다음' }).click();

      // then: 2단계 aria-live 텍스트로 교체
      await expect(liveRegion).toContainText(
        '7단계 중 2단계. 함께 공부하는 사람들을 확인할 수 있어요. 토마토 색상은 완료한 세션 수를, 노트북과 커피는 각 참가자의 집중·휴식 상태를 나타내요.',
      );
    });

    test('SSE 에러가 발생하면 열려 있던 투어가 자동으로 닫히고 에러 오버레이가 노출된다', async ({
      page,
    }) => {
      // given: SSE 연결 완료 상태로 시작해 투어를 연다
      // mockRoomWithSSEConnected는 FakeSSEEventSource를 주입한다.
      // window.__triggerSSEError()로 onerror를 직접 발화시켜 sseStatus='error'로 전환한다.
      await mockRoomWithSSEConnected(page);
      await page.goto('/pomodoro/r1');
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
      await expect(page.getByRole('region', { name: '채팅' })).toBeVisible();
      await expect(tourDialog).not.toBeVisible();
      await expect(page.getByRole('textbox', { name: '메시지' })).toBeFocused();
    });

    test('SSE 연결 완료 전에는 How to use 버튼이 접근성 트리에 노출되지 않는다', async ({
      page,
    }) => {
      // given: SSE가 hanging 상태(연결만 됐고 room_state 이벤트 미수신 → isConfirmed=false)
      await mockEnterRoomOnly(page);
      await page.goto('/pomodoro/r1');

      // then: How to use 버튼이 DOM에 없어야 한다
      const triggerBtn = page.getByRole('button', { name: 'how to use' });
      await expect(triggerBtn).not.toBeAttached();
    });
  });

  test.describe('P-E. 초대코드 모달로 초대코드를 확인한다', () => {
    test('Enter로 열면 코드가 보이고 포커스가 닫기 버튼으로 이동하며 Tab이 배경으로 나가지 않는다', async ({
      page,
    }) => {
      // given
      await mockRoomWithSSEConnected(page);
      await page.goto('/pomodoro/r1');
      const openBtn = page.getByRole('button', { name: '초대코드 보기' });
      await expect(openBtn).toBeVisible();
      await openBtn.focus();

      // when
      await page.keyboard.press('Enter');

      // then: dialog와 코드가 보이고 포커스는 닫기 버튼
      const dialog = page.getByRole('dialog', { name: '초대코드' });
      await expect(dialog).toBeVisible();
      await expect(dialog.getByText('ABC234')).toBeVisible();
      await expect(page.getByRole('button', { name: '닫기' })).toBeFocused();

      // when: Tab 반복
      for (let i = 0; i < 6; i++) {
        await page.keyboard.press('Tab');

        // then: 배경 버튼으로 포커스가 나가지 않는다 (dialog 끝에서는 브라우저 UI로 빠질 수 있다)
        await expect(
          page.getByRole('button', { name: 'how to use' }),
        ).not.toBeFocused();
        await expect(
          page.getByRole('button', { name: '초대코드 보기' }),
        ).not.toBeFocused();
      }
    });

    test('Escape로 닫히고 열기 버튼으로 포커스가 복원된다', async ({
      page,
    }) => {
      // given
      await mockRoomWithSSEConnected(page);
      await page.goto('/pomodoro/r1');
      const openBtn = page.getByRole('button', { name: '초대코드 보기' });
      await openBtn.focus();
      await page.keyboard.press('Enter');
      const dialog = page.getByRole('dialog', { name: '초대코드' });
      await expect(dialog).toBeVisible();

      // when
      await page.keyboard.press('Escape');

      // then
      await expect(dialog).not.toBeVisible();
      await expect(openBtn).toBeFocused();
    });

    test('백드롭을 클릭하면 닫힌다', async ({ page }) => {
      // given
      await mockRoomWithSSEConnected(page);
      await page.goto('/pomodoro/r1');
      await page.getByRole('button', { name: '초대코드 보기' }).focus();
      await page.keyboard.press('Enter');
      const dialog = page.getByRole('dialog', { name: '초대코드' });
      await expect(dialog).toBeVisible();

      // when: 화면 모서리(백드롭) 클릭
      await page.mouse.click(10, 10);

      // then
      await expect(dialog).not.toBeVisible();
    });

    test('닫기 버튼을 Enter로 누르면 닫히고 열기 버튼으로 포커스가 복원된다', async ({
      page,
    }) => {
      // given
      await mockRoomWithSSEConnected(page);
      await page.goto('/pomodoro/r1');
      const openBtn = page.getByRole('button', { name: '초대코드 보기' });
      await openBtn.focus();
      await page.keyboard.press('Enter');
      const dialog = page.getByRole('dialog', { name: '초대코드' });
      await expect(page.getByRole('button', { name: '닫기' })).toBeFocused();

      // when
      await page.keyboard.press('Enter');

      // then
      await expect(dialog).not.toBeVisible();
      await expect(openBtn).toBeFocused();
    });

    test('투어가 열린 채 모달을 열면 투어는 사라지고 Escape 후 열기 버튼으로 포커스가 간다', async ({
      page,
    }) => {
      // given: 투어가 열린 상태
      await mockRoomWithSSEConnected(page);
      await page.goto('/pomodoro/r1');
      await page.getByRole('button', { name: 'how to use' }).click();
      const tourDialog = page.getByRole('dialog', { name: '뽀모도로 사용법' });
      await expect(tourDialog).toBeVisible();
      const openBtn = page.getByRole('button', { name: '초대코드 보기' });

      // when: 키보드로 열기 버튼에 가서 Enter
      await openBtn.focus();
      await page.keyboard.press('Enter');

      // then: 투어는 사라지고 초대코드 dialog만 열린다
      const inviteDialog = page.getByRole('dialog', { name: '초대코드' });
      await expect(inviteDialog).toBeVisible();
      await expect(tourDialog).not.toBeVisible();

      // when
      await page.keyboard.press('Escape');

      // then
      await expect(inviteDialog).not.toBeVisible();
      await expect(openBtn).toBeFocused();
    });

    test('코드 복사하기를 Enter로 누르면 클립보드에 코드가 복사되고 복사했다고 발화한다', async ({
      page,
      context,
    }) => {
      // given
      await context.grantPermissions(['clipboard-read', 'clipboard-write']);
      await mockRoomWithSSEConnected(page);
      await page.goto('/pomodoro/r1');
      await page.getByRole('button', { name: '초대코드 보기' }).focus();
      await page.keyboard.press('Enter');
      const dialog = page.getByRole('dialog', { name: '초대코드' });
      await expect(dialog.getByText('ABC234')).toBeVisible();
      const copyBtn = page.getByRole('button', { name: '코드 복사하기' });
      await copyBtn.focus();

      // when
      await page.keyboard.press('Enter');

      // then: 클립보드에는 코드만, 버튼은 결과로 바뀌고 포커스는 유지, status가 발화된다
      await expect(
        page.getByRole('button', { name: '복사했어요!' }),
      ).toBeFocused();
      expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
        'ABC234',
      );
      await expect(page.getByRole('status')).toHaveText(
        '초대코드를 복사했어요',
      );
    });
  });

  test.describe('P-F. 시간 설정 모달로 집중·휴식 시간을 바꾼다', () => {
    test('Enter로 열어 집중·휴식 시간을 바꾸고 저장하면 요청을 보내고 열기 버튼으로 포커스가 돌아온다', async ({
      page,
    }) => {
      // given
      await mockRoomWithSSEConnected(page);
      const requestBodies = await mockTimerDuration(page);
      await page.goto('/pomodoro/r1');
      const openBtn = page.getByRole('button', { name: '시간 설정' });
      await expect(openBtn).toBeVisible();
      await openBtn.focus();

      // when: 단계 1~2
      await page.keyboard.press('Enter');

      // then
      const dialog = page.getByRole('dialog', { name: '시간 설정' });
      await expect(dialog).toBeVisible();
      await expect(dialog.getByRole('group', { name: '집중' })).toContainText(
        '25분',
      );
      await expect(dialog.getByRole('group', { name: '휴식' })).toContainText(
        '5분',
      );
      await expect(page.getByRole('button', { name: '닫기' })).toBeFocused();

      // when: 단계 3
      const increaseFocusBtn = page.getByRole('button', {
        name: '집중 시간 늘리기',
      });
      await increaseFocusBtn.focus();
      await page.keyboard.press('Enter');

      // then
      await expect(dialog.getByRole('group', { name: '집중' })).toContainText(
        '30분',
      );
      await expect(page.getByRole('status').first()).toHaveText('30분');
      await expect(increaseFocusBtn).toBeFocused();

      // when: 단계 4
      const decreaseBreakBtn = page.getByRole('button', {
        name: '휴식 시간 줄이기',
      });
      await decreaseBreakBtn.focus();
      for (let i = 0; i < 4; i++) await page.keyboard.press('Enter');

      // then
      await expect(dialog.getByRole('group', { name: '휴식' })).toContainText(
        '1분',
      );
      await expect(decreaseBreakBtn).toHaveAttribute('aria-disabled', 'true');
      await expect(decreaseBreakBtn).toBeFocused();

      // when: 단계 5
      await page.keyboard.press('Enter');

      // then
      await expect(dialog.getByRole('group', { name: '휴식' })).toContainText(
        '1분',
      );
      await expect(decreaseBreakBtn).toBeFocused();

      // when: 단계 6
      await page.getByRole('button', { name: '저장하기' }).focus();
      await page.keyboard.press('Enter');

      // then
      await expect(dialog).not.toBeVisible();
      await expect(openBtn).toBeFocused();
      expect(requestBodies).toEqual([{ focusMinutes: 30, breakMinutes: 1 }]);
    });

    test('Escape로 닫히고 열기 버튼으로 포커스가 복원된다', async ({
      page,
    }) => {
      // given
      await mockRoomWithSSEConnected(page);
      await page.goto('/pomodoro/r1');
      const openBtn = page.getByRole('button', { name: '시간 설정' });
      await openBtn.focus();
      await page.keyboard.press('Enter');
      const dialog = page.getByRole('dialog', { name: '시간 설정' });
      await expect(dialog).toBeVisible();

      // when
      await page.keyboard.press('Escape');

      // then
      await expect(dialog).not.toBeVisible();
      await expect(openBtn).toBeFocused();
    });

    test('저장이 409로 거절되면 진행 중이라고 알리고 모달은 열려 있다', async ({
      page,
    }) => {
      // given
      await mockRoomWithSSEConnected(page);
      await mockTimerDuration(page, { status: 409 });
      await page.goto('/pomodoro/r1');
      await page.getByRole('button', { name: '시간 설정' }).focus();
      await page.keyboard.press('Enter');
      const dialog = page.getByRole('dialog', { name: '시간 설정' });
      const saveBtn = page.getByRole('button', { name: '저장하기' });
      await saveBtn.focus();

      // when
      await page.keyboard.press('Enter');

      // then
      await expect(page.getByRole('alert')).toHaveText(
        '진행 중에는 바꿀 수 없어요',
      );
      await expect(dialog).toBeVisible();
    });

    test('방이 진행 중이면 현재 값만 보이고 조절·저장 버튼은 눌러도 변화가 없다', async ({
      page,
    }) => {
      // given
      await mockRoomWithSSEConnected(page, {
        roomOverrides: {
          mode: 'FOCUS',
          timer: {
            status: 'RUNNING',
            focusTimeSec: 1500,
            breakTimeSec: 300,
            totalCycle: 4,
            timerStartedAt: new Date().toISOString(),
            remainingTimeSec: 1500,
          },
        },
      });
      const requestBodies = await mockTimerDuration(page);
      await page.goto('/pomodoro/r1');
      await page.getByRole('button', { name: '시간 설정' }).focus();

      // when
      await page.keyboard.press('Enter');

      // then
      const dialog = page.getByRole('dialog', { name: '시간 설정' });
      await expect(
        dialog.getByText('뽀모도로 진행 중에는 설정을 바꿀 수 없어요'),
      ).toBeVisible();
      await expect(dialog.getByRole('group', { name: '집중' })).toContainText(
        '25분',
      );
      const names = [
        '집중 시간 늘리기',
        '집중 시간 줄이기',
        '휴식 시간 늘리기',
        '휴식 시간 줄이기',
        '저장하기',
      ];
      for (const name of names) {
        const button = page.getByRole('button', { name });
        await expect(button).toHaveAttribute('aria-disabled', 'true');
        await button.focus();
        await page.keyboard.press('Enter');
        await expect(button).toBeFocused();
      }
      await expect(dialog.getByRole('group', { name: '집중' })).toContainText(
        '25분',
      );
      await expect(dialog.getByRole('group', { name: '휴식' })).toContainText(
        '5분',
      );
      expect(requestBodies).toEqual([]);
    });

    test('투어가 열린 채 설정 모달을 열면 투어는 사라지고 닫으면 열기 버튼으로 포커스가 간다', async ({
      page,
    }) => {
      // given
      await mockRoomWithSSEConnected(page);
      await page.goto('/pomodoro/r1');
      await page.getByRole('button', { name: 'how to use' }).click();
      const tourDialog = page.getByRole('dialog', { name: '뽀모도로 사용법' });
      await expect(tourDialog).toBeVisible();
      const openBtn = page.getByRole('button', { name: '시간 설정' });

      // when
      await openBtn.focus();
      await page.keyboard.press('Enter');

      // then
      const settingsDialog = page.getByRole('dialog', { name: '시간 설정' });
      await expect(settingsDialog).toBeVisible();
      await expect(tourDialog).not.toBeVisible();

      // when
      await page.keyboard.press('Escape');

      // then
      await expect(settingsDialog).not.toBeVisible();
      await expect(openBtn).toBeFocused();
    });
  });

  test.describe('P-G. 리셋 버튼으로 타이머를 처음으로 되돌린다', () => {
    test('대기 중에는 리셋이 비활성이고, 진행 중에 누르면 요청을 보내 대기로 돌아온다', async ({
      page,
    }) => {
      // given
      await mockRoomWithSSEConnected(page);
      const resetCalls = await mockTimerAction(page, 'reset');
      await page.goto('/pomodoro/r1');
      const resetBtn = page.getByRole('button', { name: '리셋' });
      await expect(resetBtn).toBeVisible();
      const idleRoom = {
        roomId: 'test-room',
        participants: [
          {
            id: 'self-p1',
            nickname: '토마토1',
            statusMessage: '',
            completedCycles: 1,
          },
        ],
        timer: {
          status: 'IDLE' as const,
          focusTimeSec: 1500,
          breakTimeSec: 300,
          totalCycle: 4,
          timerStartedAt: null,
          remainingTimeSec: 1500,
        },
        mode: 'IDLE' as const,
        currentCycle: 0,
      };
      const runningRoom = {
        ...idleRoom,
        mode: 'FOCUS' as const,
        currentCycle: 1,
        timer: {
          ...idleRoom.timer,
          status: 'RUNNING' as const,
          timerStartedAt: new Date().toISOString(),
        },
      };

      // when: 단계 1~2
      await resetBtn.focus();
      await page.keyboard.press('Enter');

      // then
      await expect(resetBtn).toHaveAttribute('aria-disabled', 'true');
      expect(resetCalls.count).toBe(0);
      await expect(page.getByText('idle')).toBeVisible();

      // when: 단계 3
      await emitSseEvent(page, 'room_state', runningRoom);

      // then
      await expect(page.getByText('1st focus')).toBeVisible();
      await expect(page.getByRole('button', { name: 'pause' })).toBeVisible();
      await expect(resetBtn).toHaveAttribute('aria-disabled', 'false');

      // when: 단계 4
      await resetBtn.focus();
      await page.keyboard.press('Enter');
      await emitSseEvent(page, 'pomodoro_reset', idleRoom);

      // then
      await expect.poll(() => resetCalls.count).toBe(1);
      await expect(page.getByText('idle')).toBeVisible();
      await expect(page.locator('[data-tour-id="timer"]')).toHaveText(
        '25 : 00',
      );
      await expect(page.getByRole('button', { name: 'start' })).toBeVisible();
      await expect(resetBtn).toBeFocused();
      await expect(resetBtn).toHaveAttribute('aria-disabled', 'true');
    });
  });

  test.describe('P-H. 피드백 모달로 피드백을 보낸다', () => {
    test('Enter로 열어 내용과 첨부를 넣고 전송하면 완료가 발화되고 닫으면 포커스가 열기 버튼으로 돌아간다', async ({
      page,
    }) => {
      // given
      await mockRoomWithSSEConnected(page);
      let releaseResponse!: () => void;
      const responseReleased = new Promise<void>((resolve) => {
        releaseResponse = resolve;
      });
      await page.route('**/api/feedbacks', async (route) => {
        await responseReleased;
        await route.fulfill({ status: 204 });
      });
      await page.goto('/pomodoro/r1');
      const openBtn = page.getByRole('button', { name: '피드백 보내기' });
      await openBtn.focus();

      // when: 열기
      await page.keyboard.press('Enter');

      // then: 포커스는 내용 입력칸, 전송하기는 비활성
      const dialog = page.getByRole('dialog', { name: '피드백 보내기' });
      const textbox = dialog.getByRole('textbox', { name: '내용' });
      await expect(dialog).toBeVisible();
      await expect(textbox).toBeFocused();
      await expect(textbox).toHaveAttribute(
        'placeholder',
        '어떤 점이 좋았고 어떤 점이 불편했는지 적어주세요',
      );
      await expect(
        dialog.getByRole('button', { name: '전송하기' }),
      ).toBeDisabled();

      // when: 입력
      await page.keyboard.type('좋아요');

      // then
      await expect(textbox).toHaveValue('좋아요');
      await expect(
        dialog.getByRole('button', { name: '전송하기' }),
      ).toBeEnabled();

      // when: Esc
      await page.keyboard.press('Escape');

      // then: 내용이 있어 닫히지 않는다
      await expect(dialog).toBeVisible();

      // when: 파일 선택
      await dialog.getByTestId('feedback-file-input').setInputFiles({
        name: 'shot.png',
        mimeType: 'image/png',
        buffer: Buffer.from('png'),
      });

      // then
      const list = dialog.getByRole('list', { name: '첨부 파일' });
      await expect(list.getByRole('listitem')).toHaveCount(1);
      await expect(
        list.getByRole('button', { name: 'shot.png 빼기' }),
      ).toBeVisible();

      // when: 전송 앞으로 Tab
      const detailLink = dialog.getByRole('link', { name: '자세히 보기' });
      await expect(dialog).toContainText(
        '피드백과 함께 접속 정보(IP, 참여자 ID, 브라우저 정보)가 운영팀 메일로 전송돼요.',
      );
      await expect(detailLink).toHaveAttribute('href', '/privacy.html');
      await expect(detailLink).toHaveAttribute('target', '_blank');
      await detailLink.focus();
      await page.keyboard.press('Tab');

      // then: 자세히 보기 링크 다음이 전송하기
      await expect(
        dialog.getByRole('button', { name: '전송하기' }),
      ).toBeFocused();

      // when: 전송
      await page.keyboard.press('Enter');

      // then: 응답이 오기 전에는 전송 중으로 비활성
      await expect(
        dialog.getByRole('button', { name: '전송 중' }),
      ).toBeDisabled();

      // when: 응답 도착
      releaseResponse();

      // then: status 발화
      await expect(dialog.getByRole('status')).toHaveText('피드백을 보냈어요');

      // when: 닫기
      await expect(dialog.getByRole('button', { name: '닫기' })).toBeFocused();
      await page.keyboard.press('Enter');

      // then
      await expect(dialog).not.toBeVisible();
      await expect(openBtn).toBeFocused();
    });
  });

  test.describe('P-I. 채팅창을 열어 메시지를 주고받는다', () => {
    test('닫혀 있으면 포커스가 들어가지 않고, 열어 메시지를 주고받은 뒤 닫으면 열기 버튼으로 포커스가 돌아간다', async ({
      page,
    }) => {
      // given
      await mockRoomWithSSEConnected(page);
      const chat = await mockChatMessage(page);
      await page.goto('/pomodoro/r1');
      const openBtn = page.getByRole('button', { name: /^chat/ });
      const region = page.getByRole('region', { name: '채팅' });
      const textbox = page.getByRole('textbox', { name: '메시지' });
      const items = page.getByRole('log').getByRole('listitem');
      await expect(openBtn).toBeVisible();
      await emitSseEvent(page, 'chat_history', { messages: [] });

      // when: 단계 1
      await openBtn.focus();
      await page.keyboard.press('Tab');

      // then
      await expect(region).toBeHidden();
      await expect(page.locator('section :focus')).toHaveCount(0);

      // when: 단계 2
      await emitSseEvent(page, 'chat_message', {
        id: 1,
        senderId: 'other-p2',
        nickname: '토마토2',
        content: '안녕하세요',
        sentAt: new Date(2026, 0, 1, 14, 3).toISOString(),
      });

      // then
      await expect(openBtn).toHaveAccessibleName('chat 안 읽은 메시지 있음');

      // when: 단계 3
      await openBtn.focus();
      await page.keyboard.press('Enter');

      // then
      await expect(region).toBeVisible();
      await expect(textbox).toBeFocused();
      await expect(openBtn).toBeHidden();
      await expect(items).toHaveCount(1);
      await expect(items.first()).toContainText('토마토2');
      await expect(items.first()).toContainText('14:03');
      await expect(items.first()).toContainText('안녕하세요');

      // when: 단계 4
      await page.keyboard.type('다들 화이팅');
      await page.keyboard.press('Enter');

      // then
      await expect(items).toHaveCount(2);
      await expect(items.last()).toContainText(/^나/);
      await expect(items.last()).toContainText('다들 화이팅');
      await expect(textbox).toHaveValue('');
      await expect(textbox).toBeFocused();

      // when: 단계 5
      chat.status = 429;
      await page.keyboard.type('또 보내기');
      await page.keyboard.press('Enter');

      // then
      await expect(region.getByRole('alert')).toHaveText(
        '너무 자주 보냈어요. 잠시 후 다시 보내 주세요',
      );
      await expect(textbox).toHaveValue('또 보내기');
      expect(chat.contents).toEqual(['다들 화이팅', '또 보내기']);

      // when: 단계 6
      await page.keyboard.press('Escape');

      // then
      await expect(region).toBeHidden();
      await expect(openBtn).toBeFocused();
      await expect(openBtn).toHaveAccessibleName('chat');

      // when: 단계 7
      await page.keyboard.press('Enter');

      // then
      await expect(region).toBeVisible();
      await expect(textbox).toHaveValue('또 보내기');

      // when: 단계 8
      await region.getByRole('button', { name: '채팅 닫기' }).focus();
      await page.keyboard.press('Enter');

      // then
      await expect(region).toBeHidden();
      await expect(openBtn).toBeFocused();
    });
  });
});
