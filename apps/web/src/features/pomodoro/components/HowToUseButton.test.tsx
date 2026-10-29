import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { HowToUseButton } from './HowToUseButton';

describe('HowToUseButton', () => {
  it('`isOpen` 값에 따라 `aria-expanded`가 토글된다', () => {
    // given
    const { rerender } = render(
      <HowToUseButton isOpen={false} onClick={() => {}} />,
    );

    // when: isOpen=false
    // then
    expect(screen.getByRole('button').getAttribute('aria-expanded')).toBe(
      'false',
    );

    // when: isOpen=true
    rerender(<HowToUseButton isOpen={true} onClick={() => {}} />);

    // then
    expect(screen.getByRole('button').getAttribute('aria-expanded')).toBe(
      'true',
    );
  });

  it('클릭 시 `onClick`이 호출된다', () => {
    // given
    const handleClick = vi.fn();
    render(<HowToUseButton isOpen={false} onClick={handleClick} />);

    // when
    fireEvent.click(screen.getByRole('button'));

    // then
    expect(handleClick).toHaveBeenCalledOnce();
  });

  it('접근성 이름이 "how to use"로 노출된다(role="button")', () => {
    // given
    render(<HowToUseButton isOpen={false} onClick={() => {}} />);

    // when / then
    expect(screen.getByRole('button', { name: 'how to use' })).toBeTruthy();
  });
});
