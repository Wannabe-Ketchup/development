import { describe, expect, it } from 'vitest';
import {
  getSheetHeightPx,
  isKeyboardOpen,
  getSheetTopPx,
  MIN_SHEET_HEIGHT_PX,
} from './chat-sheet-layout';

describe('chat-sheet-layout', () => {
  it('처음 연 화면 높이의 25% 아래에 시트 윗면을 둔다', () => {
    expect(getSheetTopPx(852)).toBe(213);
  });

  it('키보드가 올라와 보이는 높이가 줄어도 윗면은 그대로 두고 높이만 준다', () => {
    // given
    const sheetTop = getSheetTopPx(699);

    // when
    const withoutKeyboard = getSheetHeightPx(699, sheetTop);
    const withKeyboard = getSheetHeightPx(362, sheetTop);

    // then
    expect(699 - withoutKeyboard).toBe(sheetTop);
    expect(362 - withKeyboard).toBe(sheetTop);
  });

  it('남는 높이가 최소 높이보다 작으면 윗면을 올려 최소 높이를 지킨다', () => {
    // given
    const sheetTop = getSheetTopPx(852);

    // when
    const height = getSheetHeightPx(300, sheetTop);

    // then
    expect(height).toBe(MIN_SHEET_HEIGHT_PX);
  });

  it('보이는 높이가 최소 높이보다도 작으면 보이는 높이를 넘지 않는다', () => {
    expect(getSheetHeightPx(120, 50)).toBe(120);
  });

  it('연 순간보다 보이는 높이가 크게 줄면 키보드가 올라온 것으로 본다', () => {
    expect(isKeyboardOpen(408, 699)).toBe(true);
    // 주소창이 접히고 펴지는 정도의 변화는 키보드가 아니다
    expect(isKeyboardOpen(640, 699)).toBe(false);
  });
});
