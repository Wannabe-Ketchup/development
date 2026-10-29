import { getTomatoStage } from './tomato-stage';

describe('getTomatoStage', () => {
  it.each([
    { completedCycles: 0, stage: 1 },
    { completedCycles: 1, stage: 2 },
    { completedCycles: 2, stage: 3 },
  ])(
    '마친 바퀴 수보다 한 단계 높은 토마토가 된다 ($completedCycles → $stage단계)',
    ({ completedCycles, stage }) => {
      // when
      const result = getTomatoStage(completedCycles);

      // then
      expect(result).toBe(stage);
    },
  );

  it.each([
    { completedCycles: 3 },
    { completedCycles: 4 },
    { completedCycles: 8 },
  ])(
    '3바퀴 이상 마치면 마지막 단계인 4단계에 머문다 ($completedCycles)',
    ({ completedCycles }) => {
      // when
      const result = getTomatoStage(completedCycles);

      // then
      expect(result).toBe(4);
    },
  );
});
