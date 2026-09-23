export type TomatoState =
  | { status: 'sleeping' }
  | { status: 'dragging'; pos: { x: number; y: number } }
  | { status: 'studying' };

export type TomatoAction =
  | { type: 'DRAG_START'; pos: { x: number; y: number } }
  | { type: 'DRAG_MOVE'; pos: { x: number; y: number } }
  | { type: 'DROP'; isOverTable: boolean }
  | { type: 'CANCEL' };

export const initialTomatoState: TomatoState = { status: 'sleeping' };

export function tomatoReducer(
  state: TomatoState,
  action: TomatoAction,
): TomatoState {
  switch (action.type) {
    case 'DRAG_START':
      return { status: 'dragging', pos: action.pos };
    case 'DRAG_MOVE':
      if (state.status !== 'dragging') return state;
      return { status: 'dragging', pos: action.pos };
    case 'DROP':
      if (state.status !== 'dragging') return state;
      return { status: action.isOverTable ? 'studying' : 'sleeping' };
    case 'CANCEL':
      return { status: 'sleeping' };
  }
}
