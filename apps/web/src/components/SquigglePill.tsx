import type { ReactNode } from 'react';
import { WobblyBox } from '@squiggle-line/react';

// 알약 안 내용(라벨 div, 버튼)에 주는 클래스. 여백을 여기 둬야 테두리가 글자에서 떨어지고,
// relative여야 흰 채우기가 글자를 덮지 않는다
export const PILL_CONTENT_CLASS_NAME =
  'relative inline-flex items-center justify-center gap-2 px-5 py-3 text-title whitespace-nowrap text-black';

// 데스크톱 방의 알약(회차 라벨, how to use). 높이 48에 글자는 제목 크기다
export const ROOM_PILL_CONTENT_CLASS_NAME =
  'relative inline-flex items-center justify-center gap-2 px-4 py-2 text-title whitespace-nowrap text-black';

// 좁은 화면 하단 조작 줄의 알약. 높이 48에 맞춰 여백과 글자를 줄인다
export const COMPACT_PILL_CONTENT_CLASS_NAME =
  'relative inline-flex items-center justify-center gap-2 px-4.5 py-2.5 text-body-lg whitespace-nowrap text-black';

// 아이콘만 보이는 지름 48 원형 버튼(시작·일시정지·재개). 접근 가능한 이름은 IconButton의 label로 둔다
export const ICON_PILL_CONTENT_CLASS_NAME =
  'relative inline-flex size-12 items-center justify-center text-black';

interface SquigglePillProps {
  children: ReactNode;
}

export function SquigglePill({ children }: SquigglePillProps) {
  return (
    <WobblyBox
      borderRadius={999}
      strokeWidth={3}
      pathClassName="fill-white stroke-black"
      frequency={500}
      wiggle={5}
      smoothen={12}
    >
      {children}
    </WobblyBox>
  );
}
