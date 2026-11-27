import { useState } from 'react';
import {
  getSeatMoveDurationMs,
  SEAT_MOVE_MIN_DURATION_MS,
} from '../lib/seat-layout';

// 좌석 위치(translateX)가 바뀔 때마다 직전 위치에서 움직인 거리로 transition 시간을 정한다.
// 이전 값은 렌더 중에 state로 비교한다(React 문서의 "이전 렌더의 값 저장하기")
export function useSeatMoveDuration(translateX: number): number {
  const [previousX, setPreviousX] = useState(translateX);
  const [durationMs, setDurationMs] = useState(SEAT_MOVE_MIN_DURATION_MS);

  if (previousX !== translateX) {
    setPreviousX(translateX);
    setDurationMs(getSeatMoveDurationMs(translateX - previousX));
  }

  return durationMs;
}
