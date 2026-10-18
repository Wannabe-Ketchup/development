import type { Room as RoomState } from '@pomodoro/shared';
import { NotFoundException } from '@nestjs/common';
import { ChangeStatusMessageService } from '../../../src/pomodoro/service/change-status-message.service';
import { RoomQueryService } from '../../../src/pomodoro/service/room-query.service';
import { SseService } from '../../../src/pomodoro/service/sse.service';
import { InMemoryRoomRepository } from '../../../src/pomodoro/repository/in-memory.room.repository';
import { Room } from '../../../src/pomodoro/domain/room.entity';
import { Participant } from '../../../src/pomodoro/domain/participant.entity';

describe('ChangeStatusMessageService', () => {
  it('상태메시지를 변경하면 저장소에 반영된다.', () => {
    // given
    const roomId = 'roomId';
    const participantId = 'A';
    const joinedAt = '2026-09-02T00:00:00.000Z';
    const roomRepository = new InMemoryRoomRepository();
    const service = new ChangeStatusMessageService(
      new RoomQueryService(roomRepository),
      roomRepository,
      new SseService(),
    );
    const room = Room.create(roomId);
    room.join(Participant.create(participantId, '케첩', joinedAt));
    roomRepository.save(room);
    const newStatusMessage = '집중 중';

    // when
    service.changeStatusMessage(roomId, participantId, newStatusMessage);

    // then
    const expectedStatusMessage = '집중 중';
    expect(
      roomRepository.findById(roomId)?.participants.get(participantId)
        ?.statusMessage,
    ).toBe(expectedStatusMessage);
  });

  it('상태메시지 변경에 성공하면 변경된 방 상태를 1회 발행한다.', () => {
    // given
    const roomId = 'roomId';
    const participantId = 'A';
    const joinedAt = '2026-09-02T00:00:00.000Z';
    const roomRepository = new InMemoryRoomRepository();
    const sseService = new SseService();
    const service = new ChangeStatusMessageService(
      new RoomQueryService(roomRepository),
      roomRepository,
      sseService,
    );
    const room = Room.create(roomId);
    room.join(Participant.create(participantId, '케첩', joinedAt));
    roomRepository.save(room);
    const newStatusMessage = '집중 중';

    const publishedStates: RoomState[] = [];
    sseService
      .subscribe(roomId)
      .subscribe((message) => publishedStates.push(message.data as RoomState));

    // when
    service.changeStatusMessage(roomId, participantId, newStatusMessage);

    // then
    const expectedPublishCount = 1;
    const expectedStatusMessage = '집중 중';
    expect(publishedStates).toHaveLength(expectedPublishCount);
    expect(
      publishedStates[0].participants.find(
        (participant) => participant.id === participantId,
      )?.statusMessage,
    ).toBe(expectedStatusMessage);
  });

  it('상태메시지 변경이 거절되면 방 상태를 발행하지 않는다.', () => {
    // given
    const roomId = 'roomId';
    const joinedAt = '2026-09-02T00:00:00.000Z';
    const roomRepository = new InMemoryRoomRepository();
    const sseService = new SseService();
    const service = new ChangeStatusMessageService(
      new RoomQueryService(roomRepository),
      roomRepository,
      sseService,
    );
    const room = Room.create(roomId);
    room.join(Participant.create('A', '케첩', joinedAt));
    roomRepository.save(room);
    const unknownParticipantId = 'unknownParticipantId';
    const newStatusMessage = '집중 중';

    const publishedStates: RoomState[] = [];
    sseService
      .subscribe(roomId)
      .subscribe((message) => publishedStates.push(message.data as RoomState));

    // when
    expect(() =>
      service.changeStatusMessage(
        roomId,
        unknownParticipantId,
        newStatusMessage,
      ),
    ).toThrow(NotFoundException);

    // then
    const expectedPublishCount = 0;
    expect(publishedStates).toHaveLength(expectedPublishCount);
  });

  it('존재하지 않는 방의 참여자는 상태메시지를 변경할 수 없다.', () => {
    // given
    const unknownRoomId = 'unknownRoomId';
    const participantId = 'A';
    const roomRepository = new InMemoryRoomRepository();
    const service = new ChangeStatusMessageService(
      new RoomQueryService(roomRepository),
      roomRepository,
      new SseService(),
    );
    const newStatusMessage = '집중 중';

    // when & then
    expect(() =>
      service.changeStatusMessage(
        unknownRoomId,
        participantId,
        newStatusMessage,
      ),
    ).toThrow(NotFoundException);
  });
});
