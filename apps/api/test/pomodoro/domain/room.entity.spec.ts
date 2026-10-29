import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import {
  BREAK_DURATION_SECONDS,
  CYCLE_COUNT,
  FOCUS_DURATION_SECONDS,
  ROOM_MODE,
  type RoomMode,
} from '@pomodoro/shared';
import { Room } from '../../../src/pomodoro/domain/room.entity';
import { Participant } from '../../../src/pomodoro/domain/participant.entity';
import { Timer } from '../../../src/pomodoro/domain/timer.entity';

const ROOM_ID = 'room-1';
const PARTICIPANT_ID = 'participant-1';
const ROOM_CAPACITY = 4;
const JOINED_AT = '2026-09-02T00:00:00.000Z';

function idleTimer(): Timer {
  return Timer.restore({
    status: 'IDLE',
    focusTimeSec: FOCUS_DURATION_SECONDS,
    breakTimeSec: BREAK_DURATION_SECONDS,
    totalCycle: CYCLE_COUNT,
    timerStartedAt: null,
    remainingTimeSec: FOCUS_DURATION_SECONDS,
  });
}

function runningTimer(timerStartedAt: string, remainingTimeSec: number): Timer {
  return Timer.restore({
    status: 'RUNNING',
    focusTimeSec: FOCUS_DURATION_SECONDS,
    breakTimeSec: BREAK_DURATION_SECONDS,
    totalCycle: CYCLE_COUNT,
    timerStartedAt,
    remainingTimeSec,
  });
}

function pausedTimer(remainingTimeSec: number): Timer {
  return Timer.restore({
    status: 'PAUSED',
    focusTimeSec: FOCUS_DURATION_SECONDS,
    breakTimeSec: BREAK_DURATION_SECONDS,
    totalCycle: CYCLE_COUNT,
    timerStartedAt: null,
    remainingTimeSec,
  });
}

function restoreRoom(props: {
  mode: RoomMode;
  currentCycle: number;
  timer: Timer;
  participants?: Participant[];
}): Room {
  return Room.restore({
    roomId: ROOM_ID,
    capacity: ROOM_CAPACITY,
    ...props,
    participants: props.participants ?? [
      Participant.create(PARTICIPANT_ID, '케첩', JOINED_AT),
    ],
  });
}

function restoreParticipant(id: string, completedCycles: number): Participant {
  return Participant.restore({
    id,
    nickname: '케첩',
    statusMessage: '',
    completedCycles,
    joinedAt: JOINED_AT,
  });
}

describe('Room', () => {
  it('방 생성 시 기본 모드는 IDLE 이다.', () => {
    // given
    const roomId = 'roomId';

    // when
    const room = Room.create(roomId);

    // then
    expect(room.roomId).toBe(roomId);
    expect(room.participants.size).toBe(0);
    expect(room.mode).toBe(ROOM_MODE.IDLE);
  });

  it('방 생성 시 기본 사이클은 0이다.', () => {
    // given
    const roomId = 'roomId';

    // when
    const room = Room.create(roomId);

    // then
    expect(room.roomId).toBe(roomId);
    expect(room.participants.size).toBe(0);
    expect(room.currentCycle).toBe(0);
  });

  it('방 생성 시 타이머는 IDLE 상태의 기본값(집중 25분, 휴식 5분)으로 초기화된다.', () => {
    // given
    const roomId = 'roomId';

    // when
    const room = Room.create(roomId);

    // then
    expect(room.timer.status).toBe('IDLE');
    expect(room.timer.focusTimeSec).toBe(1500);
    expect(room.timer.breakTimeSec).toBe(300);
    expect(room.timer.timerStartedAt).toBeNull();
    expect(room.timer.remainingTimeSec).toBe(room.timer.focusTimeSec);
  });

  it('방에 있는 참가자는 퇴장시키면 참가자 목록에서 제거된다.', () => {
    // given
    const room = Room.create('room-1');
    const participant = Participant.create(
      'participant-1',
      'name',
      new Date().toISOString(),
    );
    room.join(participant);

    // when
    room.leave(participant.id);

    // then
    expect(room.participants.size).toBe(0);
  });

  it('참가자는 방의 정원이 비어있으면 방에 참가할 수 있다.', () => {
    // given
    const roomId = 'roomId';
    const participantId = 'A';
    const nickname = '케첩';
    const joinedAt = '2026-09-02T00:00:00.000Z';
    const room = Room.create(roomId);
    const participant = Participant.create(participantId, nickname, joinedAt);

    // when
    room.join(participant);

    // then
    const expectedSize = 1;
    expect(room.participants.size).toBe(expectedSize);
    expect(room.participants.get(participantId)).toBe(participant);
  });

  it('방의 정원이 모두 찼을 때 새로운 참가자가 입장하면 예외가 발생한다.', () => {
    // given
    const roomId = 'roomId';
    const joinedAt = '2026-09-02T00:00:00.000Z';
    const room = Room.create(roomId);
    const participant1 = Participant.create('1', 'name1', joinedAt);
    const participant2 = Participant.create('2', 'name2', joinedAt);
    const participant3 = Participant.create('3', 'name3', joinedAt);
    const participant4 = Participant.create('4', 'name4', joinedAt);
    room.join(participant1);
    room.join(participant2);
    room.join(participant3);
    room.join(participant4);

    const newParticipant = Participant.create('5', 'name5', joinedAt);

    // when & then
    expect(() => room.join(newParticipant)).toThrow(BadRequestException);
  });

  it('정원이 찬 방에서 참가자가 나가면 새 참가자가 들어올 수 있다 (CAP-02)', () => {
    // given
    const joinedAt = '2026-09-02T00:00:00.000Z';
    const room = Room.create('roomId');
    room.join(Participant.create('1', 'name1', joinedAt));
    room.join(Participant.create('2', 'name2', joinedAt));
    room.join(Participant.create('3', 'name3', joinedAt));
    room.join(Participant.create('4', 'name4', joinedAt));
    const newParticipant = Participant.create('5', 'name5', joinedAt);

    // when
    room.leave('1');
    room.join(newParticipant);

    // then
    const expectedSize = 4;
    expect(room.participants.size).toBe(expectedSize);
    expect(room.participants.get('5')).toBe(newParticipant);
  });

  it('같은 방의 다른 참가자가 쓰지 않는 닉네임이면 변경할 수 있다.', () => {
    // given
    const roomId = 'roomId';
    const joinedAt = '2026-09-02T00:00:00.000Z';
    const participantId = 'A';
    const room = Room.create(roomId);
    room.join(Participant.create(participantId, '케첩', joinedAt));
    room.join(Participant.create('B', '머스타드', joinedAt));
    const newNickname = '마요';

    // when
    room.changeNickname(participantId, newNickname);

    // then
    const expectedNickname = '마요';
    expect(room.participants.get(participantId)?.nickname).toBe(
      expectedNickname,
    );
  });

  it('같은 방의 다른 참가자가 쓰는 닉네임으로는 변경할 수 없다.', () => {
    // given
    const roomId = 'roomId';
    const joinedAt = '2026-09-02T00:00:00.000Z';
    const participantId = 'A';
    const room = Room.create(roomId);
    room.join(Participant.create(participantId, '케첩', joinedAt));
    room.join(Participant.create('B', '머스타드', joinedAt));
    const newNickname = '머스타드';

    // when & then
    const expectedMessage = '이미 사용 중인 닉네임입니다.';
    expect(() => room.changeNickname(participantId, newNickname)).toThrow(
      expectedMessage,
    );
  });

  it('본인의 현재 닉네임으로 변경하는 경우 중복으로 처리하지 않는다.', () => {
    // given
    const roomId = 'roomId';
    const joinedAt = '2026-09-02T00:00:00.000Z';
    const participantId = 'A';
    const room = Room.create(roomId);
    room.join(Participant.create(participantId, '케첩', joinedAt));
    room.join(Participant.create('B', '머스타드', joinedAt));
    const newNickname = '케첩';

    // when
    room.changeNickname(participantId, newNickname);

    // then
    const expectedNickname = '케첩';
    expect(room.participants.get(participantId)?.nickname).toBe(
      expectedNickname,
    );
  });

  it('중복된 닉네임 변경이 거절되면 두 참가자의 닉네임이 그대로 유지된다.', () => {
    // given
    const roomId = 'roomId';
    const joinedAt = '2026-09-02T00:00:00.000Z';
    const requesterId = 'A';
    const ownerId = 'B';
    const room = Room.create(roomId);
    room.join(Participant.create(requesterId, '케첩', joinedAt));
    room.join(Participant.create(ownerId, '머스타드', joinedAt));
    const newNickname = '머스타드';

    // when
    expect(() => room.changeNickname(requesterId, newNickname)).toThrow(
      BadRequestException,
    );

    // then
    const expectedRequesterNickname = '케첩';
    const expectedOwnerNickname = '머스타드';
    expect(room.participants.get(requesterId)?.nickname).toBe(
      expectedRequesterNickname,
    );
    expect(room.participants.get(ownerId)?.nickname).toBe(
      expectedOwnerNickname,
    );
  });

  it('방에 없는 참가자의 닉네임은 변경할 수 없다.', () => {
    // given
    const roomId = 'roomId';
    const joinedAt = '2026-09-02T00:00:00.000Z';
    const room = Room.create(roomId);
    room.join(Participant.create('A', '케첩', joinedAt));
    const unknownParticipantId = 'Z';
    const newNickname = '마요';

    // when & then
    const expectedMessage = '방에 존재하지 않는 참가자입니다.';
    expect(() =>
      room.changeNickname(unknownParticipantId, newNickname),
    ).toThrow(expectedMessage);
  });

  it('다른 방의 참가자가 쓰는 닉네임으로는 변경할 수 있다.', () => {
    // given
    const joinedAt = '2026-09-02T00:00:00.000Z';
    const participantId = 'B';
    const room1 = Room.create('roomId1');
    room1.join(Participant.create('A', '케첩', joinedAt));
    const room2 = Room.create('roomId2');
    room2.join(Participant.create(participantId, '머스타드', joinedAt));
    const newNickname = '케첩';

    // when
    room2.changeNickname(participantId, newNickname);

    // then
    const expectedNickname = '케첩';
    expect(room2.participants.get(participantId)?.nickname).toBe(
      expectedNickname,
    );
  });

  it('대소문자가 다른 닉네임은 다른 닉네임으로 취급한다.', () => {
    // given
    const roomId = 'roomId';
    const joinedAt = '2026-09-02T00:00:00.000Z';
    const participantId = 'A';
    const room = Room.create(roomId);
    room.join(Participant.create(participantId, 'ketchup', joinedAt));
    room.join(Participant.create('B', 'mustard', joinedAt));
    const newNickname = 'Mustard';

    // when
    room.changeNickname(participantId, newNickname);

    // then
    const expectedNickname = 'Mustard';
    expect(room.participants.get(participantId)?.nickname).toBe(
      expectedNickname,
    );
  });

  it('방의 참가자는 상태메시지를 변경할 수 있다.', () => {
    // given
    const roomId = 'roomId';
    const joinedAt = '2026-09-02T00:00:00.000Z';
    const participantId = 'A';
    const room = Room.create(roomId);
    room.join(Participant.create(participantId, '케첩', joinedAt));
    const newStatusMessage = '집중 중';

    // when
    room.changeStatusMessage(participantId, newStatusMessage);

    // then
    const expectedStatusMessage = '집중 중';
    expect(room.participants.get(participantId)?.statusMessage).toBe(
      expectedStatusMessage,
    );
  });

  describe('startPomodoro', () => {
    it('대기 상태에서 다음 세트를 시작해도 참여자의 마친 바퀴 수는 그대로다', () => {
      // given
      const room = restoreRoom({
        mode: ROOM_MODE.IDLE,
        currentCycle: 0,
        timer: idleTimer(),
        participants: [restoreParticipant(PARTICIPANT_ID, 4)],
      });

      // when
      room.startPomodoro(PARTICIPANT_ID, new Date('2026-10-17T09:00:00.000Z'));

      // then
      expect(room.participants.get(PARTICIPANT_ID)?.completedCycles).toBe(4);
    });

    it('대기 중인 방에서 시작하면 1회차 집중이 지금 시각부터 집중 시간만큼 진행된다', () => {
      // given
      const room = restoreRoom({
        mode: ROOM_MODE.IDLE,
        currentCycle: 0,
        timer: idleTimer(),
      });
      const now = new Date('2026-10-17T09:00:00.000Z');

      // when
      room.startPomodoro(PARTICIPANT_ID, now);

      // then
      expect(room.mode).toBe(ROOM_MODE.FOCUS);
      expect(room.currentCycle).toBe(1);
      expect(room.timer.status).toBe('RUNNING');
      expect(room.timer.timerStartedAt).toBe('2026-10-17T09:00:00.000Z');
      expect(room.timer.remainingTimeSec).toBe(FOCUS_DURATION_SECONDS);
    });

    it.each([
      {
        mode: ROOM_MODE.FOCUS,
        createTimer: () =>
          runningTimer('2026-10-17T09:00:00.000Z', FOCUS_DURATION_SECONDS),
      },
      {
        mode: ROOM_MODE.BREAK,
        createTimer: () =>
          runningTimer('2026-10-17T09:25:00.000Z', FOCUS_DURATION_SECONDS),
      },
      { mode: ROOM_MODE.FOCUS, createTimer: () => pausedTimer(600) },
    ])(
      '$mode 상태의 방은 진행 중이든 일시정지 중이든 뽀모도로를 시작할 수 없다',
      ({ mode, createTimer }) => {
        // given
        const room = restoreRoom({
          mode,
          currentCycle: 2,
          timer: createTimer(),
        });
        const now = new Date('2026-10-17T09:30:00.000Z');

        // when & then
        expect(() => room.startPomodoro(PARTICIPANT_ID, now)).toThrow(
          ConflictException,
        );
        expect(room.mode).toBe(mode);
        expect(room.currentCycle).toBe(2);
        expect(room.timer).toEqual(createTimer());
      },
    );

    it('방에 없는 참가자는 뽀모도로를 시작할 수 없다', () => {
      // given
      const room = restoreRoom({
        mode: ROOM_MODE.IDLE,
        currentCycle: 0,
        timer: idleTimer(),
      });
      const unknownParticipantId = 'unknown-participant';
      const now = new Date('2026-10-17T09:00:00.000Z');

      // when & then
      expect(() => room.startPomodoro(unknownParticipantId, now)).toThrow(
        NotFoundException,
      );
    });
  });

  describe('pausePomodoro', () => {
    it('진행 중인 방을 일시정지하면 모드와 회차는 그대로이고 타이머가 그 순간의 남은 시간에서 멈춘다', () => {
      // given
      const room = restoreRoom({
        mode: ROOM_MODE.FOCUS,
        currentCycle: 2,
        timer: runningTimer('2026-10-17T09:00:00.000Z', FOCUS_DURATION_SECONDS),
      });
      const now = new Date('2026-10-17T09:10:00.000Z');

      // when
      room.pausePomodoro(PARTICIPANT_ID, now);

      // then
      expect(room.mode).toBe(ROOM_MODE.FOCUS);
      expect(room.currentCycle).toBe(2);
      expect(room.timer).toEqual(pausedTimer(FOCUS_DURATION_SECONDS - 600));
    });

    it.each([
      { now: '2026-10-17T09:15:00.500Z', expected: 600 },
      { now: '2026-10-17T09:24:59.999Z', expected: 1 },
    ])(
      '남은 시간에 1초 미만이 있으면 화면에 보이던 초(올림)에서 멈춘다 (now: $now → $expected초)',
      ({ now, expected }) => {
        // given
        const room = restoreRoom({
          mode: ROOM_MODE.FOCUS,
          currentCycle: 1,
          timer: runningTimer(
            '2026-10-17T09:00:00.000Z',
            FOCUS_DURATION_SECONDS,
          ),
        });

        // when
        room.pausePomodoro(PARTICIPANT_ID, new Date(now));

        // then
        expect(room.timer).toEqual(pausedTimer(expected));
      },
    );

    it('단계 종료 예정 시각이 된 방은 일시정지할 수 없다', () => {
      // given
      const timer = runningTimer(
        '2026-10-17T09:00:00.000Z',
        FOCUS_DURATION_SECONDS,
      );
      const room = restoreRoom({
        mode: ROOM_MODE.FOCUS,
        currentCycle: 1,
        timer,
      });
      const now = new Date('2026-10-17T09:25:00.000Z');

      // when & then
      expect(() => room.pausePomodoro(PARTICIPANT_ID, now)).toThrow(
        ConflictException,
      );
      expect(room.timer).toEqual(timer);
    });

    it.each([
      { status: 'IDLE', mode: ROOM_MODE.IDLE, createTimer: idleTimer },
      {
        status: 'PAUSED',
        mode: ROOM_MODE.FOCUS,
        createTimer: () => pausedTimer(600),
      },
    ])(
      '$status 상태의 타이머는 일시정지할 수 없다',
      ({ mode, createTimer }) => {
        // given
        const room = restoreRoom({
          mode,
          currentCycle: 1,
          timer: createTimer(),
        });
        const now = new Date('2026-10-17T09:10:00.000Z');

        // when & then
        expect(() => room.pausePomodoro(PARTICIPANT_ID, now)).toThrow(
          ConflictException,
        );
        expect(room.timer).toEqual(createTimer());
      },
    );

    it('방에 없는 참가자는 일시정지할 수 없다', () => {
      // given
      const room = restoreRoom({
        mode: ROOM_MODE.FOCUS,
        currentCycle: 1,
        timer: runningTimer('2026-10-17T09:00:00.000Z', FOCUS_DURATION_SECONDS),
      });
      const now = new Date('2026-10-17T09:10:00.000Z');

      // when & then
      expect(() => room.pausePomodoro('unknown-participant', now)).toThrow(
        NotFoundException,
      );
    });
  });

  describe('resumePomodoro', () => {
    it('일시정지 중인 방을 재개하면 모드와 회차는 그대로이고 지금부터 멈춘 남은 시간 뒤에 단계가 끝난다', () => {
      // given
      const room = restoreRoom({
        mode: ROOM_MODE.BREAK,
        currentCycle: 2,
        timer: pausedTimer(120),
      });
      const now = new Date('2026-10-17T10:00:00.000Z');

      // when
      room.resumePomodoro(PARTICIPANT_ID, now);

      // then
      expect(room.mode).toBe(ROOM_MODE.BREAK);
      expect(room.currentCycle).toBe(2);
      expect(room.timer).toEqual(runningTimer('2026-10-17T10:00:00.000Z', 120));
      expect(room.timer.scheduledEndAt()).toEqual(
        new Date('2026-10-17T10:02:00.000Z'),
      );
    });

    it.each([
      { status: 'IDLE', mode: ROOM_MODE.IDLE, createTimer: idleTimer },
      {
        status: 'RUNNING',
        mode: ROOM_MODE.FOCUS,
        createTimer: () =>
          runningTimer('2026-10-17T09:00:00.000Z', FOCUS_DURATION_SECONDS),
      },
    ])('$status 상태의 타이머는 재개할 수 없다', ({ mode, createTimer }) => {
      // given
      const room = restoreRoom({
        mode,
        currentCycle: 1,
        timer: createTimer(),
      });
      const now = new Date('2026-10-17T09:10:00.000Z');

      // when & then
      expect(() => room.resumePomodoro(PARTICIPANT_ID, now)).toThrow(
        ConflictException,
      );
      expect(room.timer).toEqual(createTimer());
    });

    it('방에 없는 참가자는 재개할 수 없다', () => {
      // given
      const room = restoreRoom({
        mode: ROOM_MODE.FOCUS,
        currentCycle: 1,
        timer: pausedTimer(600),
      });
      const now = new Date('2026-10-17T09:10:00.000Z');

      // when & then
      expect(() => room.resumePomodoro('unknown-participant', now)).toThrow(
        NotFoundException,
      );
    });
  });

  describe('finishFocus', () => {
    it('집중이 끝나는 것만으로는 참여자의 마친 바퀴 수가 늘지 않는다', () => {
      // given
      const room = restoreRoom({
        mode: ROOM_MODE.FOCUS,
        currentCycle: 1,
        timer: runningTimer('2026-10-17T09:00:00.000Z', FOCUS_DURATION_SECONDS),
        participants: [restoreParticipant(PARTICIPANT_ID, 0)],
      });

      // when
      room.finishFocus();

      // then
      expect(room.participants.get(PARTICIPANT_ID)?.completedCycles).toBe(0);
    });

    it('집중이 끝나면 같은 회차의 휴식이 집중 종료 예정 시각부터 시작된다', () => {
      // given
      const room = restoreRoom({
        mode: ROOM_MODE.FOCUS,
        currentCycle: 2,
        timer: runningTimer('2026-10-17T09:00:00.000Z', FOCUS_DURATION_SECONDS),
      });

      // when
      room.finishFocus();

      // then
      expect(room.mode).toBe(ROOM_MODE.BREAK);
      expect(room.currentCycle).toBe(2);
      expect(room.timer.status).toBe('RUNNING');
      expect(room.timer.timerStartedAt).toBe('2026-10-17T09:25:00.000Z');
      expect(room.timer.remainingTimeSec).toBe(BREAK_DURATION_SECONDS);
    });
  });

  describe('finishBreak', () => {
    it.each([{ cycle: 1 }, { cycle: CYCLE_COUNT }])(
      '$cycle회차 휴식이 끝나면 방에 있는 참여자마다 마친 바퀴 수가 1씩 늘어난다',
      ({ cycle }) => {
        // given
        const room = restoreRoom({
          mode: ROOM_MODE.BREAK,
          currentCycle: cycle,
          timer: runningTimer(
            '2026-10-17T09:25:00.000Z',
            BREAK_DURATION_SECONDS,
          ),
          participants: [
            restoreParticipant('participant-a', 0),
            restoreParticipant('participant-b', 2),
          ],
        });

        // when
        room.finishBreak();

        // then
        expect(room.participants.get('participant-a')?.completedCycles).toBe(1);
        expect(room.participants.get('participant-b')?.completedCycles).toBe(3);
      },
    );

    it('마지막 회차 전의 휴식이 끝나면 다음 회차 집중이 시작된다 (3회차 휴식 → 4회차 집중)', () => {
      // given
      const room = restoreRoom({
        mode: ROOM_MODE.BREAK,
        currentCycle: 3,
        timer: runningTimer('2026-10-17T09:25:00.000Z', BREAK_DURATION_SECONDS),
      });

      // when
      room.finishBreak();

      // then
      expect(room.mode).toBe(ROOM_MODE.FOCUS);
      expect(room.currentCycle).toBe(4);
      expect(room.timer.status).toBe('RUNNING');
      expect(room.timer.timerStartedAt).toBe('2026-10-17T09:30:00.000Z');
      expect(room.timer.remainingTimeSec).toBe(FOCUS_DURATION_SECONDS);
    });

    it('마지막 회차 휴식이 끝나면 방은 대기 상태로 돌아가고 회차와 타이머가 처음 상태가 된다', () => {
      // given
      const room = restoreRoom({
        mode: ROOM_MODE.BREAK,
        currentCycle: CYCLE_COUNT,
        timer: runningTimer('2026-10-17T10:55:00.000Z', BREAK_DURATION_SECONDS),
      });

      // when
      room.finishBreak();

      // then
      expect(room.mode).toBe(ROOM_MODE.IDLE);
      expect(room.currentCycle).toBe(0);
      expect(room.timer.status).toBe('IDLE');
      expect(room.timer.timerStartedAt).toBeNull();
      expect(room.timer.remainingTimeSec).toBe(FOCUS_DURATION_SECONDS);
    });
  });

  describe('finishFocus / finishBreak', () => {
    const focusTimer = () =>
      runningTimer('2026-10-17T09:00:00.000Z', FOCUS_DURATION_SECONDS);
    const breakTimer = () =>
      runningTimer('2026-10-17T09:25:00.000Z', BREAK_DURATION_SECONDS);

    it.each([
      {
        phase: '집중 종료',
        mode: ROOM_MODE.BREAK,
        currentCycle: 1,
        createTimer: breakTimer,
        finish: (room: Room) => room.finishFocus(),
      },
      {
        phase: '집중 종료',
        mode: ROOM_MODE.IDLE,
        currentCycle: 0,
        createTimer: idleTimer,
        finish: (room: Room) => room.finishFocus(),
      },
      {
        phase: '휴식 종료',
        mode: ROOM_MODE.FOCUS,
        currentCycle: 1,
        createTimer: focusTimer,
        finish: (room: Room) => room.finishBreak(),
      },
      {
        phase: '휴식 종료',
        mode: ROOM_MODE.IDLE,
        currentCycle: 0,
        createTimer: idleTimer,
        finish: (room: Room) => room.finishBreak(),
      },
    ])(
      '현재 단계가 아닌 단계의 종료는 받아들이지 않는다 ($phase@$mode)',
      ({ mode, currentCycle, createTimer, finish }) => {
        // given
        const room = restoreRoom({ mode, currentCycle, timer: createTimer() });

        // when & then
        expect(() => finish(room)).toThrow(ConflictException);
        expect(room.mode).toBe(mode);
        expect(room.timer).toEqual(createTimer());
      },
    );
  });

  describe('remainingSecondsInPhase', () => {
    it.each([
      { now: '2026-10-17T09:20:00.000Z', expected: 300 },
      { now: '2026-10-17T09:26:00.000Z', expected: 0 },
    ])(
      '현재 단계 종료까지 남은 시간은 종료 예정 시각에서 지금을 뺀 값이고, 이미 지났으면 0이다 (now: $now → $expected초)',
      ({ now, expected }) => {
        // given
        const room = restoreRoom({
          mode: ROOM_MODE.FOCUS,
          currentCycle: 1,
          timer: runningTimer(
            '2026-10-17T09:00:00.000Z',
            FOCUS_DURATION_SECONDS,
          ),
        });

        // when
        const seconds = room.remainingSecondsInPhase(new Date(now));

        // then
        expect(seconds).toBe(expected);
      },
    );
  });
});
