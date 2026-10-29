import LampSvg from '@/assets/lamp.svg?react';
import { IconButton } from '@/components/IconButton';
import { cn } from '@/lib/cn';

interface LampProps {
  theme: 'light' | 'dark';
  onToggle: () => void;
}

export function Lamp({ theme, onToggle }: LampProps) {
  const label = theme === 'dark' ? '라이트 모드로 전환' : '다크 모드로 전환';

  return (
    <IconButton
      data-tour-id="lamp"
      label={label}
      icon={LampSvg}
      iconClassName={cn(
        'pointer-events-none cursor-pointer *:pointer-events-auto [&_.lamp-outline]:opacity-0 hover:[&_.lamp-outline]:opacity-100',
        theme === 'dark' ? 'text-lamp-off' : 'text-lamp-on',
      )}
      className="pointer-events-none absolute bottom-18 -left-38"
      onClick={onToggle}
    />
  );
}
