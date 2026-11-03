import { useEffect } from 'react';
import { requestNotificationPermissionIfUndecided } from '../lib/browser-notification';

// 방 화면에서 첫 클릭이나 키 입력 때 브라우저 알림 권한을 한 번 요청한다
export function useNotificationPermission(): void {
  useEffect(() => {
    const request = () => {
      requestNotificationPermissionIfUndecided();
      window.removeEventListener('pointerdown', request);
      window.removeEventListener('keydown', request);
    };
    window.addEventListener('pointerdown', request);
    window.addEventListener('keydown', request);
    return () => {
      window.removeEventListener('pointerdown', request);
      window.removeEventListener('keydown', request);
    };
  }, []);
}
