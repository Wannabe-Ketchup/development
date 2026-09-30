import { renderHook, act, waitFor } from '@testing-library/react';
import type { Mock } from 'vitest';
import { useNicknameEditor } from './useNicknameEditor';
import { changeNickname } from '@/api/room';

vi.mock('@/api/room');

const mockChangeNickname = changeNickname as unknown as Mock;

const renderEditor = (nickname = '토마토') =>
  renderHook(
    ({ nickname }) =>
      useNicknameEditor({ roomId: 'room-1', participantId: 'p-1', nickname }),
    { initialProps: { nickname } },
  );

const confirmWith = (
  result: { current: ReturnType<typeof useNicknameEditor> },
  nickname: string,
) => {
  act(() => result.current.startEditing());
  act(() => result.current.changeDraft(nickname));
  act(() => result.current.confirmEditing());
};

describe('useNicknameEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockChangeNickname.mockResolvedValue(undefined);
  });

  it('요청이 끝나기 전에 다시 변경하면 앞선 요청이 끝난 뒤에 보낸다', async () => {
    // given
    let resolveFirst: () => void = () => {};
    mockChangeNickname
      .mockReturnValueOnce(
        new Promise<void>((resolve) => {
          resolveFirst = resolve;
        }),
      )
      .mockResolvedValueOnce(undefined);
    const { result } = renderEditor();

    // when
    confirmWith(result, '케첩');
    confirmWith(result, '마요');

    // then
    const expectedCallCountWhileSending = 1;
    expect(mockChangeNickname).toHaveBeenCalledTimes(
      expectedCallCountWhileSending,
    );

    await act(async () => {
      resolveFirst();
    });

    const expectedCallCountAfterSending = 2;
    expect(mockChangeNickname).toHaveBeenCalledTimes(
      expectedCallCountAfterSending,
    );
    expect(mockChangeNickname).toHaveBeenLastCalledWith('room-1', 'p-1', '마요');
  });

  it('요청 중에 여러 번 변경하면 마지막 값만 보낸다', async () => {
    // given
    let resolveFirst: () => void = () => {};
    mockChangeNickname
      .mockReturnValueOnce(
        new Promise<void>((resolve) => {
          resolveFirst = resolve;
        }),
      )
      .mockResolvedValueOnce(undefined);
    const { result } = renderEditor();

    // when
    confirmWith(result, '케첩');
    confirmWith(result, '마요');
    confirmWith(result, '머스타드');
    await act(async () => {
      resolveFirst();
    });

    // then
    const expectedCallCount = 2;
    expect(mockChangeNickname).toHaveBeenCalledTimes(expectedCallCount);
    expect(mockChangeNickname).toHaveBeenLastCalledWith(
      'room-1',
      'p-1',
      '머스타드',
    );
  });

  it('뒤이어 보낼 값이 있으면 앞선 거절은 알리지 않는다', async () => {
    // given
    let rejectFirst: (cause: Error) => void = () => {};
    mockChangeNickname
      .mockReturnValueOnce(
        new Promise<void>((_, reject) => {
          rejectFirst = reject;
        }),
      )
      .mockResolvedValueOnce(undefined);
    const { result } = renderEditor();

    // when
    confirmWith(result, '케첩');
    confirmWith(result, '마요');
    await act(async () => {
      rejectFirst(new Error('이미 사용 중인 닉네임입니다.'));
    });

    // then
    expect(result.current.error).toBeNull();
  });

  it('거절이 도착했을 때 사용자가 다시 입력 중이면 입력 중인 내용을 덮어쓰지 않는다', async () => {
    // given
    let rejectFirst: (cause: Error) => void = () => {};
    mockChangeNickname.mockReturnValueOnce(
      new Promise<void>((_, reject) => {
        rejectFirst = reject;
      }),
    );
    const { result } = renderEditor();
    confirmWith(result, '케첩');
    act(() => result.current.startEditing());
    act(() => result.current.changeDraft('마요'));

    // when
    await act(async () => {
      rejectFirst(new Error('이미 사용 중인 닉네임입니다.'));
    });

    // then
    const expectedDraft = '마요';
    expect(result.current.draft).toBe(expectedDraft);
    expect(result.current.error).toBeNull();
  });

  it('서버 상태가 내가 바꾼 값으로 따라오면 낙관적 표시를 거둔다', async () => {
    // given
    const { result, rerender } = renderEditor('토마토');
    confirmWith(result, '케첩');

    // when
    rerender({ nickname: '케첩' });

    // then
    const expectedNickname = '케첩';
    await waitFor(() => expect(result.current.nickname).toBe(expectedNickname));
  });
});
