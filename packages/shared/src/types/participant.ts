export interface Participant {
  id: string;
  nickname: string;
  statusMessage: string;
  // 방에 들어온 뒤 마친 바퀴(집중 + 휴식) 수. 들어오면 0
  completedCycles: number;
}
