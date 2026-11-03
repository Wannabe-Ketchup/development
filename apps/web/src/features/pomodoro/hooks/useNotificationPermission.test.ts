import { renderHook } from '@testing-library/react';
import { requestNotificationPermissionIfUndecided } from '../lib/browser-notification';
import { useNotificationPermission } from './useNotificationPermission';

vi.mock('../lib/browser-notification');

describe('useNotificationPermission', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('첫 클릭에 권한을 요청하고, 그 뒤 클릭·키 입력에는 다시 요청하지 않는다', () => {
    // given
    renderHook(() => useNotificationPermission());

    // when
    window.dispatchEvent(new Event('pointerdown'));
    window.dispatchEvent(new Event('pointerdown'));
    window.dispatchEvent(new Event('keydown'));

    // then
    const expectedRequestCount = 1;
    expect(requestNotificationPermissionIfUndecided).toHaveBeenCalledTimes(
      expectedRequestCount,
    );
  });
});
