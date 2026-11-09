import { EnterRoomError, enterRoomByInviteCode } from './room';

describe('enterRoomByInviteCode', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('초대코드 입장 API가 404를 주면 없는 방으로 실패한다', async () => {
    // given
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(null, { status: 404 })),
    );

    // when
    const result = enterRoomByInviteCode('K7P2QX');

    // then
    await expect(result).rejects.toMatchObject({ reason: 'not-found' });
  });

  it('초대코드 입장 API가 400을 주면 서버 안내 문구를 담아 거절로 실패한다', async () => {
    // given
    const serverMessage = '방의 정원이 모두 찼습니다.';
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          Response.json(
            { statusCode: 400, message: serverMessage, error: 'Bad Request' },
            { status: 400 },
          ),
        ),
    );

    // when
    const result = enterRoomByInviteCode('K7P2QX');

    // then
    await expect(result).rejects.toBeInstanceOf(EnterRoomError);
    await expect(result).rejects.toMatchObject({
      reason: 'rejected',
      message: serverMessage,
    });
  });
});
