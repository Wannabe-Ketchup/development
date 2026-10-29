const TOMATO_STAGE_COUNT = 4;

export type TomatoStage = 1 | 2 | 3 | 4;

// 방에 들어오면 1단계이고 한 바퀴를 마칠 때마다 한 단계씩 자라며, 4단계에서 멈춘다
// 0 → 1, 2 → 3, 3 → 4, 5 → 4
export function getTomatoStage(completedCycles: number): TomatoStage {
  return Math.min(completedCycles + 1, TOMATO_STAGE_COUNT) as TomatoStage;
}
