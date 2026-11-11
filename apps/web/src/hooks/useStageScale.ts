import { createContext, useContext } from 'react';

export const StageScaleContext = createContext(1);

// 축소 스테이지 안에서 화면 좌표(clientX, getBoundingClientRect)와 스테이지 px를 바꿀 때 쓴다. 스테이지 밖에서는 1이다.
export function useStageScale(): number {
  return useContext(StageScaleContext);
}
