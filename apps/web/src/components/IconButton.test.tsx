import type { SVGProps } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { IconButton } from './IconButton';

function TestIcon(props: SVGProps<SVGSVGElement>) {
  return <svg data-testid="icon" {...props} />;
}

describe('IconButton', () => {
  it('동작을 설명하는 label을 버튼의 접근 가능한 이름으로 제공하고 SVG를 숨긴다', () => {
    // given
    render(<IconButton label="저장" icon={TestIcon} />);

    // when
    const button = screen.getByRole('button', { name: '저장' });

    // then
    expect(button).toBeTruthy();
    expect(button.getAttribute('type')).toBe('button');
    expect(screen.getByTestId('icon').getAttribute('aria-hidden')).toBe('true');
  });

  it('비활성 상태에서는 클릭할 수 없고 전달된 버튼 속성을 유지한다', () => {
    // given
    const onClick = vi.fn();
    render(
      <IconButton
        label="저장"
        icon={TestIcon}
        disabled
        className="custom-button"
        onClick={onClick}
      />,
    );
    const button = screen.getByRole('button', { name: '저장' });

    // when
    fireEvent.click(button);

    // then
    expect(button.hasAttribute('disabled')).toBe(true);
    expect(button.className).toContain('custom-button');
    expect(onClick).not.toHaveBeenCalled();
  });

  it('label이 바뀌면 버튼의 접근 가능한 이름도 바뀐다', () => {
    // given
    const { rerender } = render(
      <IconButton label="음악 재생" icon={TestIcon} />,
    );

    // when
    rerender(<IconButton label="음악 중지" icon={TestIcon} />);

    // then
    expect(screen.getByRole('button', { name: '음악 중지' })).toBeTruthy();
  });
});
