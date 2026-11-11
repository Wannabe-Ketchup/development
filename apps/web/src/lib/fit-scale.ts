interface Size {
  width: number;
  height: number;
}

// 모달 둘레에 남길 화면 여백
export const FIT_GUTTER_PX = 16;

// content를 비율 그대로 viewport 안(여백 제외)에 넣는 배율. 이미 들어가면 1이다
export function getFitScale(content: Size, viewport: Size): number {
  if (content.width === 0 || content.height === 0) return 1;
  return Math.min(
    1,
    (viewport.width - FIT_GUTTER_PX * 2) / content.width,
    (viewport.height - FIT_GUTTER_PX * 2) / content.height,
  );
}
