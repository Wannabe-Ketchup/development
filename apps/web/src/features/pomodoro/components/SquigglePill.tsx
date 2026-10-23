import type { ReactNode } from 'react';
import { WobblyBox } from '@squiggle-line/react';

// 알약 안 내용(라벨 div, 버튼)에 주는 클래스. 여백을 여기 둬야 테두리가 글자에서 떨어지고,
// relative여야 흰 채우기가 글자를 덮지 않는다
export const PILL_CONTENT_CLASS_NAME =
  'relative inline-flex items-center justify-center gap-2 px-5 py-3.5 text-[26px] leading-[normal] tracking-[0.1em] whitespace-nowrap text-black';

interface SquigglePillProps {
  children: ReactNode;
}

export function SquigglePill({ children }: SquigglePillProps) {
  return (
    <WobblyBox
      borderRadius={30}
      strokeWidth={4}
      pathClassName="fill-white stroke-black"
      frequency={500}
      wiggle={20}
      smoothen={30}
    >
      {children}
    </WobblyBox>
  );
}
