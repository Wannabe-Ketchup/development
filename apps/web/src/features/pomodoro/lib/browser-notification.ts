// Notification API를 다루는 유일한 곳. 지원하지 않거나 막힌 환경에서도 호출하는 쪽이 안전하게 부를 수 있다.

function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

// 권한을 아직 정하지 않았을 때만 요청한다. 사용자 입력 이벤트 핸들러 안에서 불러야 한다.
export function requestNotificationPermissionIfUndecided(): void {
  if (!isNotificationSupported()) return;
  if (Notification.permission !== 'default') return;
  try {
    Notification.requestPermission().catch(() => {});
  } catch {
    // 콜백만 지원하는 구형 Safari 등은 무시한다
  }
}

// 권한이 허용됐을 때만 알림을 띄운다. 생성이 막힌 환경(Android Chrome 등)에서는 아무것도 하지 않는다.
export function showNotificationIfPermitted(
  title: string,
  options: NotificationOptions,
): void {
  if (!isNotificationSupported()) return;
  if (Notification.permission !== 'granted') return;
  try {
    new Notification(title, options);
  } catch {
    // 알림 실패는 알림음·탭 제목에 영향을 주지 않는다
  }
}

// 탭이 숨겨졌거나 창이 포커스를 잃었으면 사용자가 화면을 보고 있지 않다고 본다
export function isUserAwayFromPage(): boolean {
  return document.visibilityState !== 'visible' || !document.hasFocus();
}
