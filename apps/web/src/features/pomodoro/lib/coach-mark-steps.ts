export type CoachMarkStep = {
  readonly id: string;
  // 여러 요소와 맞으면 모두 밝힌다(타이머 단계: 타이머 + 조작 줄)
  readonly selector: string;
  readonly description: string;
  readonly preferredPlacement?: 'top' | 'bottom' | 'left' | 'right';
};

// 타이머와 시작·중지·상태 줄을 함께 밝힌다. 말풍선은 타이머에 붙는다
const TIMER_STEP: CoachMarkStep = {
  id: 'timer',
  selector: '[data-tour-id="timer"], [data-tour-id="timer-controls"]',
  description:
    '시작·중지 버튼으로 타이머를 조작하고, 남은 시간과 현재 세션을 확인할 수 있어요.',
  preferredPlacement: 'bottom',
};

const CHAT_DESCRIPTION = '같은 방 사람들과 메시지를 주고받을 수 있어요.';

export const DESKTOP_COACH_MARK_STEPS: readonly CoachMarkStep[] = [
  TIMER_STEP,
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
  {
    id: 'chat',
    selector: '[data-tour-id="chat"]',
    description: CHAT_DESCRIPTION,
    // 데스크톱 채팅 버튼은 왼쪽 위에 있다
    preferredPlacement: 'right',
  },
] as const;

const SELF_STATUS_STEP = DESKTOP_COACH_MARK_STEPS[2];
const SELF_NICKNAME_STEP = DESKTOP_COACH_MARK_STEPS[3];

// 좁은 화면 채팅 버튼은 오른쪽 아래에 있다
const CHAT_STEP: CoachMarkStep = {
  id: 'chat',
  selector: '[data-tour-id="chat"]',
  description: CHAT_DESCRIPTION,
  preferredPlacement: 'top',
};

// 좁은 화면에는 조명·LP가 없어 5단계다
export const TABLET_COACH_MARK_STEPS: readonly CoachMarkStep[] = [
  TIMER_STEP,
  DESKTOP_COACH_MARK_STEPS[1],
  SELF_STATUS_STEP,
  SELF_NICKNAME_STEP,
  CHAT_STEP,
];

// 폰은 참여자를 한 명씩 넘겨 보므로 참여자 단계 문구만 다르다
export const MOBILE_COACH_MARK_STEPS: readonly CoachMarkStep[] = [
  TIMER_STEP,
  {
    id: 'participants',
    selector: '[data-tour-id="participants"]',
    description:
      '함께 공부하는 사람들이에요. 좌우로 넘겨 다른 참여자를 볼 수 있어요. 토마토 색은 완료한 세션 수를 나타내요.',
    preferredPlacement: 'top',
  },
  SELF_STATUS_STEP,
  SELF_NICKNAME_STEP,
  CHAT_STEP,
];
