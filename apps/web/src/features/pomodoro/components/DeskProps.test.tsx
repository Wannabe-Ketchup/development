import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ROOM_MODE } from '@pomodoro/shared';
import { DeskProps } from './DeskProps';

const PARTICIPANT_IDS = ['p1', 'p2', 'p3'];
const SEAT_SPACING_PX = 182;

describe('DeskProps', () => {
  it('집중 세션이면 참여자 수만큼 맥북이 놓이고 커피는 없다', () => {
    // when
    render(
      <DeskProps
        mode={ROOM_MODE.FOCUS}
        participantIds={PARTICIPANT_IDS}
        seatSpacingPx={SEAT_SPACING_PX}
      />,
    );

    // then
    expect(screen.getAllByTestId('desk-prop-laptop')).toHaveLength(3);
    expect(screen.queryByTestId('desk-prop-coffee')).toBeNull();
  });

  it('휴식 세션이면 참여자 수만큼 커피가 놓이고 맥북은 없다', () => {
    // when
    render(
      <DeskProps
        mode={ROOM_MODE.BREAK}
        participantIds={PARTICIPANT_IDS}
        seatSpacingPx={SEAT_SPACING_PX}
      />,
    );

    // then
    expect(screen.getAllByTestId('desk-prop-coffee')).toHaveLength(3);
    expect(screen.queryByTestId('desk-prop-laptop')).toBeNull();
  });

  it('휴식 세션이면 커피마다 김이 피어오른다', () => {
    // when
    render(
      <DeskProps
        mode={ROOM_MODE.BREAK}
        participantIds={PARTICIPANT_IDS}
        seatSpacingPx={SEAT_SPACING_PX}
      />,
    );

    // then
    expect(screen.getAllByTestId('desk-prop-steam')).toHaveLength(3);
  });

  it('대기 상태면 소품이 놓이지 않는다', () => {
    // when
    render(
      <DeskProps
        mode={ROOM_MODE.IDLE}
        participantIds={PARTICIPANT_IDS}
        seatSpacingPx={SEAT_SPACING_PX}
      />,
    );

    // then
    expect(screen.queryByTestId('desk-prop-laptop')).toBeNull();
    expect(screen.queryByTestId('desk-prop-coffee')).toBeNull();
  });
});
