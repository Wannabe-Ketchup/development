import { render, screen } from '@testing-library/react';
import { PrivacyPolicyLink } from './PrivacyPolicyLink';

describe('PrivacyPolicyLink', () => {
  it('처리방침 링크는 /privacy.html을 새 탭으로 연다', () => {
    // given
    render(<PrivacyPolicyLink />);

    // when
    const link = screen.getByRole('link', { name: '개인정보처리방침' });

    // then
    expect(link.getAttribute('href')).toBe('/privacy.html');
    expect(link.getAttribute('target')).toBe('_blank');
    expect(link.getAttribute('rel')).toBe('noopener noreferrer');
  });
});
