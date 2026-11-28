import { resolveViewedParticipantId } from './participant-carousel';

describe('resolveViewedParticipantId', () => {
  const participantIds = ['p-1', 'p-2', 'p-3'];

  it('처음에는 본인을 보여 준다', () => {
    // given
    const viewedId = null;

    // when
    const result = resolveViewedParticipantId(participantIds, viewedId, 'p-2');

    // then
    expect(result).toBe('p-2');
  });

  it('보던 참여자가 남아 있으면 그대로 둔다', () => {
    // given
    const viewedId = 'p-3';

    // when
    const result = resolveViewedParticipantId(participantIds, viewedId, 'p-2');

    // then
    expect(result).toBe('p-3');
  });

  it('보던 참여자가 나가면 본인으로 돌아간다', () => {
    // given
    const viewedId = 'p-4';

    // when
    const result = resolveViewedParticipantId(participantIds, viewedId, 'p-2');

    // then
    expect(result).toBe('p-2');
  });

  it('본인도 없으면 첫 번째 참여자를 보여 주고, 참여자가 없으면 null이다', () => {
    // given
    const selfId = null;

    // when
    const first = resolveViewedParticipantId(participantIds, null, selfId);
    const none = resolveViewedParticipantId([], null, selfId);

    // then
    expect(first).toBe('p-1');
    expect(none).toBeNull();
  });
});
