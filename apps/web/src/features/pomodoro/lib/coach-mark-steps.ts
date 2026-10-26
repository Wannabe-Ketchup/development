export const TOTAL_STEPS = 6;

export type CoachMarkStep = {
  readonly id: string;
  readonly selector: string;
  readonly description: string;
  readonly preferredPlacement?: 'top' | 'bottom' | 'left' | 'right';
};

export const COACH_MARK_STEPS: readonly CoachMarkStep[] = [
  {
    id: 'timer',
    selector: '[data-tour-id="timer"]',
    description:
      '시작·중지 버튼으로 타이머를 조작하고, 남은 시간과 현재 세션을 확인할 수 있어요.',
    preferredPlacement: 'bottom',
  },
  {
    id: 'participants',
    selector: '[data-tour-id="participants"]',
    description:
      '함께 공부하는 사람들을 확인할 수 있어요. 토마토 색상은 완료한 세션 수를, 노트북과 커피는 각 참가자의 집중·휴식 상태를 나타내요.',
    preferredPlacement: 'top',
  },
  {
    id: 'self-status',
    selector: '[data-tour-id="self-status"]',
    description:
      '말풍선 우측 상단의 수정 버튼을 눌러 상태 메시지를 바꿀 수 있어요.',
    preferredPlacement: 'top',
  },
  {
    id: 'self-nickname',
    selector: '[data-tour-id="self-nickname"]',
    description: '우측의 수정 버튼을 눌러 닉네임을 바꿀 수 있어요.',
    preferredPlacement: 'top',
  },
  {
    id: 'lamp',
    selector: '[data-tour-id="lamp"]',
    description: '조명을 눌러 다크·라이트 모드를 바꿀 수 있어요.',
    preferredPlacement: 'right',
  },
  {
    id: 'lp-player',
    selector: '[data-tour-id="lp-player"]',
    description: 'LP를 눌러 음악을 재생·중지 할 수 있어요.',
    preferredPlacement: 'left',
  },
] as const;
