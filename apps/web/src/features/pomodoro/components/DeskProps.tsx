import type { ReactNode } from 'react';
import { ROOM_MODE } from '@pomodoro/shared';
import type { RoomMode } from '@pomodoro/shared';
import LaptopSvg from '@/assets/laptop.svg?react';
import CoffeeSvg from '@/assets/coffee.svg?react';
import { cn } from '@/lib/cn';
import {
  getSeatTranslateX,
  SEAT_MOVE_TRANSITION_CLASS,
  SEAT_SPACING_PX,
} from '../lib/seat-layout';
import { useSeatMoveDuration } from '../hooks/useSeatMoveDuration';
import { SteamAnimation } from './SteamAnimation';

const DESK_PROP_BY_MODE = {
  [ROOM_MODE.FOCUS]: { Prop: LaptopProp, testId: 'desk-prop-laptop' },
  [ROOM_MODE.BREAK]: { Prop: CoffeeProp, testId: 'desk-prop-coffee' },
} as const;

interface DeskPropsProps {
  mode: RoomMode;
  participantIds: string[];
  // 좌석 가운데의 가로 위치. 기본은 책상 가운데를 기준으로 좌석 간격만큼 벌린다
  getTranslateX?: (index: number) => number;
}

// 참여자마다 좌석 앞 책상 위에 현재 세션의 소품을 놓는다. 집중은 맥북, 휴식은 커피, 대기는 없음.
// 일시정지는 mode를 바꾸지 않으므로 진행 중이던 세션의 소품이 그대로 남는다.
// 기준점은 책상 윗면 가운데이고, 너비·높이가 0이라 클릭을 막지 않는다.
export function DeskProps({
  mode,
  participantIds,
  getTranslateX = (index) =>
    getSeatTranslateX(index, participantIds.length, SEAT_SPACING_PX),
}: DeskPropsProps) {
  if (mode === ROOM_MODE.IDLE) return null;

  const { Prop, testId } = DESK_PROP_BY_MODE[mode];

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute top-9.5 left-1/2"
    >
      {participantIds.map((participantId, index) => (
        <DeskPropSeat
          key={participantId}
          testId={testId}
          translateX={getTranslateX(index)}
        >
          <Prop />
        </DeskPropSeat>
      ))}
    </div>
  );
}

interface DeskPropSeatProps {
  testId: string;
  translateX: number;
  children: ReactNode;
}

// 좌석 하나의 소품 자리. 참여자와 같은 거리·시간으로 함께 미끄러진다
function DeskPropSeat({ testId, translateX, children }: DeskPropSeatProps) {
  const moveDurationMs = useSeatMoveDuration(translateX);

  return (
    <div
      data-testid={testId}
      className={cn('absolute bottom-0 left-0', SEAT_MOVE_TRANSITION_CLASS)}
      style={{
        transform: `translateX(${translateX}px)`,
        transitionDuration: `${moveDurationMs}ms`,
      }}
    >
      {children}
    </div>
  );
}

function LaptopProp() {
  return (
    <LaptopSvg className="absolute bottom-0 left-0 h-16.25 w-25 max-w-none -translate-x-1/2" />
  );
}

// 손잡이 때문에 잔 중심이 SVG 가운데보다 왼쪽에 있다.
// SVG 가운데가 아니라 잔 중심을 좌석 가운데에 맞춘다.
// 잔과 김은 맥북보다 작게 그리고, 맥북보다 조금 앞에 놓는다.
function CoffeeProp() {
  return (
    <div className="absolute top-1 left-0">
      <CoffeeSvg className="absolute bottom-0 -left-7.5 h-auto w-19.5 max-w-none" />
      <SteamAnimation />
    </div>
  );
}
