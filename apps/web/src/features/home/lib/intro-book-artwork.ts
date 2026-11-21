// 책의 기준 좌표다. 화면 배율과 넘김 상태는 경로에 반영하지 않는다.
// 종이·표지판 모양은 디자인 시안에서 따낸 intro-book-traced-paths.ts와 intro_book_board.svg를 쓴다
export const BOOK_ARTWORK = {
  paperWidth: 470,
  paperHeight: 580,
  // 시안의 책 선 굵기. 책갈피·둥근 버튼도 같은 굵기로 맞춘다
  strokeWidth: 3.7,
  paperColor: '#f9f7ee',
  inkColor: '#2b2926',
} as const;

// 책등 옆 그늘 띠. 표지판 그림 속 맨 위 종이와 같은 자리·색이라 넘기는 종이와 이어진다
export const GUTTER_BAND = { x: 3.2, width: 6.3, color: '#f4eadf' } as const;

export const BOOK_FRAME_INSETS_PX = {
  top: 32,
  right: 255,
  bottom: 20,
  left: 255,
} as const;

export const BOOKMARK_SIZE_PX = { width: 136, height: 60 } as const;
export const BOOKMARK_PATH =
  'M 1 4 C 40 2 78 5 106 3 Q 133 3 133 30 Q 134 57 106 57 C 74 58 38 56 1 57 Z';
export const BOOKMARK_SEEDS = [401, 419, 433, 457, 479] as const;
export const BOOKMARK_FILL_CLASS_NAMES = [
  'fill-cream',
  'fill-tomato-body-1',
  'fill-tomato-body-2',
  'fill-tomato-body-3',
  'fill-tomato-body-4',
] as const;

export const ROUND_BUTTON_PATH =
  'M 27 2 C 42 1 52 13 52 27 C 53 42 41 53 27 52 C 12 53 1 41 2 27 C 1 13 13 1 27 2 Z';
// 사용법 번호 동그라미. 설명서 글 파일(IntroBookFaces.tsx)은 훅·@squiggle-line을 쓰지 않는 규칙이라
// ROUND_BUTTON_PATH에 SMALL_ARTWORK_SQUIGGLE을 적용한 결과(applySquiggle)를 미리 계산해 둔다
export const STEP_NUMBER_PATH =
  'M 29.11 2.42 C 30.36 2.64 34.78 3.64 36.43 4.42 C 38.07 5.21 42.9 8.22 44.29 9.66 C 45.69 11.1 48.6 15.83 49.33 17.72 C 50.07 19.62 51.07 25.14 51.09 27.19 C 51.12 29.23 50.27 34.75 49.55 36.64 C 48.84 38.54 45.9 43.24 44.49 44.67 C 43.07 46.1 38.39 49.1 36.49 49.85 C 34.59 50.59 29.02 51.53 26.94 51.54 C 24.87 51.55 19.27 50.67 17.35 49.94 C 15.43 49.21 10.67 46.23 9.22 44.8 C 7.77 43.37 4.74 38.62 3.99 36.71 C 3.24 34.79 2.31 29.17 2.31 27.09 C 2.32 25 3.27 19.39 4.03 17.48 C 4.78 15.57 7.86 10.85 9.32 9.42 C 10.77 7.99 15.77 5.05 17.45 4.29 C 19.14 3.52 23.6 2.58 24.86 2.37 Z';
export const SMALL_ARTWORK_SQUIGGLE = {
  frequency: 200,
  wiggle: 5,
  smoothen: 65,
  strokeWidth: BOOK_ARTWORK.strokeWidth,
  seed: 503,
} as const;
