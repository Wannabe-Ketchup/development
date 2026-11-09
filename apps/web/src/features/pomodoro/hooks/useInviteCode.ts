import { useEffect, useState } from 'react';
import { findInviteCode } from '@/api/room';

export type InviteCodeState =
  | { status: 'loading' }
  | { status: 'success'; inviteCode: string }
  | { status: 'error' };

// 마운트 시 1회 조회한다. 언마운트 후 응답은 무시한다
export function useInviteCode(roomId: string): InviteCodeState {
  const [state, setState] = useState<InviteCodeState>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;

    findInviteCode(roomId)
      .then((response) => {
        if (cancelled) return;
        setState({ status: 'success', inviteCode: response.inviteCode });
      })
      .catch(() => {
        if (!cancelled) setState({ status: 'error' });
      });

    return () => {
      cancelled = true;
    };
  }, [roomId]);

  return state;
}
