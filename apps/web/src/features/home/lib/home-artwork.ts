// 홈 그림의 시안(데스크톱) 크기와 위치. 화면에서는 레이아웃의 그림 배율(--home-k)을 곱해 쓴다
export const HOME_ARTWORK_PX = {
  sofa: { width: 314, height: 195 },
  sleepingTomato: { width: 104, height: 107 },
  // 콧물 방울: 30×30 칸에 150×30 그림(5칸)을 넘겨 움직인다
  snotBubble: { top: 28, left: 36, frame: 30, spriteWidth: 150 },
  arrow: { width: 200, height: 68 },
  table: { width: 293, height: 162, paddingTop: 68 },
  studyingTomato: { width: 101, height: 106, top: -20 },
  // 연필: 60×60 칸에 180×61 그림(3칸)
  pencil: { right: -20, bottom: -4, frame: 60, spriteWidth: 180, height: 61 },
  // 끄는 중 놀란 토마토: 125×115 칸에 250×115 그림(2칸). 손가락에서 왼쪽으로 left, 아래로 top만큼 떨어뜨린다
  surprisedTomato: {
    frameWidth: 125,
    spriteWidth: 250,
    height: 115,
    left: 52,
    top: 10,
  },
} as const;
