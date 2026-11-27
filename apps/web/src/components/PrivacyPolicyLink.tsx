import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export const PRIVACY_POLICY_PATH = '/privacy.html';

interface PrivacyPolicyLinkProps {
  className?: string;
  children?: ReactNode;
}

// 방 연결과 작성 중인 내용을 지키려고 새 탭으로 연다
export function PrivacyPolicyLink({
  className,
  children = '개인정보처리방침',
}: PrivacyPolicyLinkProps) {
  return (
    <a
      href={PRIVACY_POLICY_PATH}
      target="_blank"
      rel="noopener noreferrer"
      className={cn('underline', className)}
    >
      {children}
    </a>
  );
}
