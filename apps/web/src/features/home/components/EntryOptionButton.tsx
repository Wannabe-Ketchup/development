import TriangleSvg from '@/assets/triangle.svg?react';
import { cn } from '@/lib/cn';

interface EntryOptionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  // 삼각형 아이콘 크기
  iconClassName?: string;
  onClick: () => void;
}

export function EntryOptionButton({
  children,
  onClick,
  className,
  iconClassName = 'size-4',
  ...rest
}: EntryOptionButtonProps) {
  return (
    <button
      className={cn(
        'flex w-full items-center gap-2 px-2 py-1 text-start text-body whitespace-nowrap text-gray hover:text-black',
        className,
      )}
      onClick={onClick}
      {...rest}
    >
      <TriangleSvg aria-hidden="true" className={iconClassName} />
      {children}
    </button>
  );
}
