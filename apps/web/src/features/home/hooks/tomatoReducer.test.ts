import { tomatoReducer } from './tomatoReducer';
import type { TomatoState } from './tomatoReducer';

describe('tomatoReducer', () => {
  it('sleeping 상태에서 ACTIVATE를 디스패치하면 studying 상태가 된다', () => {
    // given
    const state: TomatoState = { status: 'sleeping' };

    // when
    const next = tomatoReducer(state, { type: 'ACTIVATE' });

    // then
    expect(next).toEqual({ status: 'studying' });
  });

  it('sleeping이 아닌 상태에서 ACTIVATE를 디스패치하면 상태가 바뀌지 않는다', () => {
    // given
    const draggingState: TomatoState = {
      status: 'dragging',
      pos: { x: 100, y: 200 },
    };
    const studyingState: TomatoState = { status: 'studying' };

    // when
    const fromDragging = tomatoReducer(draggingState, { type: 'ACTIVATE' });
    const fromStudying = tomatoReducer(studyingState, { type: 'ACTIVATE' });

    // then
    expect(fromDragging).toBe(draggingState);
    expect(fromStudying).toBe(studyingState);
  });
});
