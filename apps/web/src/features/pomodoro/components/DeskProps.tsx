import { ROOM_MODE } from '@pomodoro/shared';
import type { RoomMode } from '@pomodoro/shared';
import LaptopSvg from '@/assets/laptop.svg?react';
import CoffeeSvg from '@/assets/coffee.svg?react';
import { cn } from '@/lib/cn';
import {
  getSeatTranslateX,
  SEAT_MOVE_TRANSITION_CLASS,
} from '../lib/seat-layout';

const DESK_PROP_BY_MODE = {
  [ROOM_MODE.FOCUS]: { Svg: LaptopSvg, testId: 'desk-prop-laptop' },
  [ROOM_MODE.BREAK]: { Svg: CoffeeSvg, testId: 'desk-prop-coffee' },
} as const;

interface DeskPropsProps {
  mode: RoomMode;
  participantIds: string[];
  seatSpacingPx: number;
}

// 참여자마다 좌석 앞 책상 위에 현재 세션의 소품을 놓는다. 집중은 맥북, 휴식은 커피, 대기는 없음.
// 일시정지는 mode를 바꾸지 않으므로 진행 중이던 세션의 소품이 그대로 남는다.
// 기준점은 책상 윗면(y≈10~70) 가운데이고, 너비·높이가 0이라 클릭을 막지 않는다.
export function DeskProps({
  mode,
  participantIds,
  seatSpacingPx,
}: DeskPropsProps) {
  if (mode === ROOM_MODE.IDLE) return null;

  const { Svg: PropSvg, testId } = DESK_PROP_BY_MODE[mode];

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute top-12.5 left-1/2"
    >
      {participantIds.map((participantId, index) => (
        <div
          key={participantId}
          data-testid={testId}
          className={cn('absolute bottom-0 left-0', SEAT_MOVE_TRANSITION_CLASS)}
          style={{
            transform: `translateX(${getSeatTranslateX(index, participantIds.length, seatSpacingPx)}px)`,
          }}
        >
          <PropSvg className="absolute bottom-0 left-0 max-w-none -translate-x-1/2" />
        </div>
      ))}
    </div>
  );
}
