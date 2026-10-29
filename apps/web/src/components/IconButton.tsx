import type { ComponentType, SVGProps } from 'react';

type IconButtonProps = Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  'aria-label' | 'children'
> & {
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  iconClassName?: string;
};

export function IconButton({
  label,
  icon: Icon,
  iconClassName,
  type = 'button',
  ...buttonProps
}: IconButtonProps) {
  return (
    <button type={type} aria-label={label} {...buttonProps}>
      <Icon aria-hidden="true" className={iconClassName} />
    </button>
  );
}
