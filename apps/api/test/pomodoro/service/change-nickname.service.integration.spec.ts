import type { Room as RoomState } from '@pomodoro/shared';
import { ChangeNicknameService } from '../../../src/pomodoro/service/change-nickname.service';
import { RoomQueryService } from '../../../src/pomodoro/service/room-query.service';
import { SseService } from '../../../src/pomodoro/service/sse.service';
import { InMemoryRoomRepository } from '../../../src/pomodoro/repository/in-memory.room.repository';
import { Room } from '../../../src/pomodoro/domain/room.entity';
import { Participant } from '../../../src/pomodoro/domain/participant.entity';
import { NotFoundException } from '@nestjs/common';

describe('ChangeNicknameService', () => {
  it('닉네임을 변경하면 저장소에 반영된다.', () => {
    // given
    const roomId = 'roomId';
    const participantId = 'A';
    const joinedAt = '2026-09-02T00:00:00.000Z';
    const roomRepository = new InMemoryRoomRepository();
    const service = new ChangeNicknameService(
      new RoomQueryService(roomRepository),
      roomRepository,
      new SseService(),
    );
    const room = Room.create(roomId);
    room.join(Participant.create(participantId, '케첩', joinedAt));
    room.join(Participant.create('B', '머스타드', joinedAt));
    roomRepository.save(room);
    const newNickname = '마요';

    // when
    service.changeNickname(roomId, participantId, newNickname);

    // then
    const expectedNickname = '마요';
    expect(
      roomRepository.findById(roomId)?.participants.get(participantId)
        ?.nickname,
    ).toBe(expectedNickname);
  });

  it('닉네임 변경에 성공하면 변경된 방 상태를 1회 발행한다.', () => {
    // given
    const roomId = 'roomId';
    const participantId = 'A';
    const joinedAt = '2026-09-02T00:00:00.000Z';
    const roomRepository = new InMemoryRoomRepository();
    const sseService = new SseService();
    const service = new ChangeNicknameService(
      new RoomQueryService(roomRepository),
      roomRepository,
      sseService,
    );
    const room = Room.create(roomId);
    room.join(Participant.create(participantId, '케첩', joinedAt));
    room.join(Participant.create('B', '머스타드', joinedAt));
    roomRepository.save(room);
    const newNickname = '마요';

    const publishedStates: RoomState[] = [];
    sseService
      .subscribe(roomId)
      .subscribe((message) => publishedStates.push(message.data as RoomState));

    // when
    service.changeNickname(roomId, participantId, newNickname);

    // then
    const expectedPublishCount = 1;
    const expectedNickname = '마요';
    expect(publishedStates).toHaveLength(expectedPublishCount);
    expect(
      publishedStates[0].participants.find(
        (participant) => participant.id === participantId,
      )?.nickname,
    ).toBe(expectedNickname);
  });

  it('닉네임 변경이 거절되면 방 상태를 발행하지 않는다.', () => {
    // given
    const roomId = 'roomId';
    const participantId = 'A';
    const joinedAt = '2026-09-02T00:00:00.000Z';
    const roomRepository = new InMemoryRoomRepository();
    const sseService = new SseService();
    const service = new ChangeNicknameService(
      new RoomQueryService(roomRepository),
      roomRepository,
      sseService,
    );
    const room = Room.create(roomId);
    room.join(Participant.create(participantId, '케첩', joinedAt));
    room.join(Participant.create('B', '머스타드', joinedAt));
    roomRepository.save(room);
    const duplicatedNickname = '머스타드';

    const publishedStates: RoomState[] = [];
    sseService
      .subscribe(roomId)
      .subscribe((message) => publishedStates.push(message.data as RoomState));

    // when
    expect(() =>
      service.changeNickname(roomId, participantId, duplicatedNickname),
    ).toThrow();

    // then
    const expectedPublishCount = 0;
    expect(publishedStates).toHaveLength(expectedPublishCount);
  });

  it('닉네임 변경이 거절되면 저장소의 닉네임도 바뀌지 않는다.', () => {
    // given
    const roomId = 'roomId';
    const participantId = 'A';
    const joinedAt = '2026-09-02T00:00:00.000Z';
    const roomRepository = new InMemoryRoomRepository();
    const service = new ChangeNicknameService(
      new RoomQueryService(roomRepository),
      roomRepository,
      new SseService(),
    );
    const room = Room.create(roomId);
    room.join(Participant.create(participantId, '케첩', joinedAt));
    room.join(Participant.create('B', '머스타드', joinedAt));
    roomRepository.save(room);
    const duplicatedNickname = '머스타드';

    // when
    expect(() =>
      service.changeNickname(roomId, participantId, duplicatedNickname),
    ).toThrow();

    // then
    const expectedNickname = '케첩';
    expect(
      roomRepository.findById(roomId)?.participants.get(participantId)
        ?.nickname,
    ).toBe(expectedNickname);
  });

  it('존재하지 않는 방의 참여자는 닉네임을 변경할 수 없다.', () => {
    // given
    const unknownRoomId = 'unknownRoomId';
    const participantId = 'A';
    const roomRepository = new InMemoryRoomRepository();
    const service = new ChangeNicknameService(
      new RoomQueryService(roomRepository),
      roomRepository,
      new SseService(),
    );
    const newNickname = '마요';

    // when & then
    expect(() =>
      service.changeNickname(unknownRoomId, participantId, newNickname),
    ).toThrow(NotFoundException);
  });

  it('동일한 닉네임으로 동시에 변경을 요청하면 하나만 성공한다.', async () => {
    // given
    const roomId = 'roomId';
    const joinedAt = '2026-09-02T00:00:00.000Z';
    const roomRepository = new InMemoryRoomRepository();
    const service = new ChangeNicknameService(
      new RoomQueryService(roomRepository),
      roomRepository,
      new SseService(),
    );
    const room = Room.create(roomId);
    room.join(Participant.create('A', '케첩', joinedAt));
    room.join(Participant.create('B', '머스타드', joinedAt));
    roomRepository.save(room);
    const newNickname = '마요';

    // when
    const results = await Promise.allSettled([
      Promise.resolve().then(() =>
        service.changeNickname(roomId, 'A', newNickname),
      ),
      Promise.resolve().then(() =>
        service.changeNickname(roomId, 'B', newNickname),
      ),
    ]);

    // then
    const expectedFulfilledCount = 1;
    expect(
      results.filter((result) => result.status === 'fulfilled'),
    ).toHaveLength(expectedFulfilledCount);
  });
});
