import type { ComponentType, Ref, SVGProps } from 'react';

type IconButtonProps = Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  'aria-label' | 'children'
> & {
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  iconClassName?: string;
  ref?: Ref<HTMLButtonElement>;
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
