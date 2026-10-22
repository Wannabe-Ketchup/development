import TriangleSvg from '@/assets/triangle.svg?react';

interface EntryOptionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  onClick: () => void;
}

export function EntryOptionButton({
  children,
  onClick,
  ...rest
}: EntryOptionButtonProps) {
  return (
    <button
      className="flex w-full items-center gap-2 px-2 py-1 text-start text-lg text-nowrap text-gray hover:text-black"
      onClick={onClick}
      {...rest}
    >
      <TriangleSvg aria-hidden="true" />
      {children}
    </button>
  );
}
