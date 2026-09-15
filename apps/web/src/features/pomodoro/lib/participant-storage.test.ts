import { describe, it, expect, beforeEach } from 'vitest';
import { saveParticipantId, getParticipantId } from './participant-storage';

describe('participant-storage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('참가자 id를 저장하면 같은 roomId로 조회했을 때 그 값을 가져온다', () => {
    // given / when
    saveParticipantId('room-1', 'participant-1');

    // then
    expect(getParticipantId('room-1')).toBe('participant-1');
  });

  it('다른 roomId로 저장된 값은 서로 섞이지 않는다', () => {
    // given
    saveParticipantId('room-1', 'participant-1');
    saveParticipantId('room-2', 'participant-2');

    // when / then
    expect(getParticipantId('room-1')).toBe('participant-1');
    expect(getParticipantId('room-2')).toBe('participant-2');
  });

  it('저장된 값이 없으면 null을 반환한다', () => {
    expect(getParticipantId('room-3')).toBeNull();
  });
});
