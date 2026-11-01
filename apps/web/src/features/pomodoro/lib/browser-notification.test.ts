import type { Mock } from 'vitest';
import {
  requestNotificationPermissionIfUndecided,
  showNotificationIfPermitted,
} from './browser-notification';

describe('browser-notification', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const stubNotification = (permission: NotificationPermission) => {
    const NotificationMock = vi.fn() as unknown as Mock & {
      permission: NotificationPermission;
      requestPermission: Mock;
    };
    NotificationMock.permission = permission;
    NotificationMock.requestPermission = vi.fn().mockResolvedValue(permission);
    vi.stubGlobal('Notification', NotificationMock);
    return NotificationMock;
  };

  it('Notification을 지원하지 않으면 에러 없이 아무것도 하지 않는다', () => {
    // given
    // jsdom에는 Notification이 없다
    expect('Notification' in window).toBe(false);

    // when
    const run = () => {
      requestNotificationPermissionIfUndecided();
      showNotificationIfPermitted('제목', { tag: 'a' });
    };

    // then
    expect(run).not.toThrow();
  });

  it('권한이 granted가 아니면 알림을 만들지 않는다', () => {
    // given
    const NotificationMock = stubNotification('denied');

    // when
    showNotificationIfPermitted('제목', { tag: 'a' });

    // then
    expect(NotificationMock).not.toHaveBeenCalled();
  });

  it('권한이 granted면 제목과 옵션으로 알림을 만든다', () => {
    // given
    const NotificationMock = stubNotification('granted');
    const options = { tag: 'a', silent: true };

    // when
    showNotificationIfPermitted('제목', options);

    // then
    expect(NotificationMock).toHaveBeenCalledWith('제목', options);
  });

  it('알림 생성이 예외를 던져도 에러 없이 넘어간다', () => {
    // given
    const NotificationMock = stubNotification('granted');
    NotificationMock.mockImplementation(() => {
      throw new TypeError('Illegal constructor');
    });

    // when
    const show = () => showNotificationIfPermitted('제목', { tag: 'a' });

    // then
    expect(show).not.toThrow();
  });

  it.each([
    { permission: 'default', expectedCallCount: 1 },
    { permission: 'granted', expectedCallCount: 0 },
    { permission: 'denied', expectedCallCount: 0 },
  ] as const)(
    '권한이 default일 때만 권한을 요청한다 ($permission)',
    ({ permission, expectedCallCount }) => {
      // given
      const NotificationMock = stubNotification(permission);

      // when
      requestNotificationPermissionIfUndecided();

      // then
      expect(NotificationMock.requestPermission).toHaveBeenCalledTimes(
        expectedCallCount,
      );
    },
  );
});
