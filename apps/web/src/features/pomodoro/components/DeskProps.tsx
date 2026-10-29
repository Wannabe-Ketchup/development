import { ROOM_MODE } from '@pomodoro/shared';
import type { RoomMode } from '@pomodoro/shared';
import LaptopSvg from '@/assets/laptop.svg?react';
import CoffeeSvg from '@/assets/coffee.svg?react';
import { cn } from '@/lib/cn';
import {
  getSeatTranslateX,
  SEAT_MOVE_TRANSITION_CLASS,
} from '../lib/seat-layout';
import { SteamAnimation } from './SteamAnimation';

const DESK_PROP_BY_MODE = {
  [ROOM_MODE.FOCUS]: { Prop: LaptopProp, testId: 'desk-prop-laptop' },
  [ROOM_MODE.BREAK]: { Prop: CoffeeProp, testId: 'desk-prop-coffee' },
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

  const { Prop, testId } = DESK_PROP_BY_MODE[mode];

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute top-8.75 left-1/2"
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
          <Prop />
        </div>
      ))}
    </div>
  );
}

function LaptopProp() {
  return (
    <LaptopSvg className="absolute bottom-0 left-0 h-18 w-27.75 max-w-none -translate-x-1/2" />
  );
}

// 손잡이 때문에 잔 중심(x≈40)이 SVG 가운데(x=51)보다 왼쪽에 있다.
// SVG 가운데가 아니라 잔 중심을 좌석 가운데에 맞춘다.
// 잔과 김은 잔 중심을 기준으로 함께 85%로 줄이고, 맥북보다 4px 앞에 놓는다.
function CoffeeProp() {
  return (
    <div className="absolute top-1 left-0 scale-85">
      <CoffeeSvg className="absolute bottom-0 -left-10 max-w-none" />
      <SteamAnimation />
    </div>
  );
}
