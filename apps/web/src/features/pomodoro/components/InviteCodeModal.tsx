import { useId } from 'react';
import CloseSvg from '@/assets/close.svg?react';
import { CopyButton } from '@/components/CopyButton';
import { IconButton } from '@/components/IconButton';
import { Modal } from '@/components/Modal';
import { useInviteCode, type InviteCodeState } from '../hooks/useInviteCode';

interface InviteCodeModalProps {
  roomId: string;
  onClose: () => void;
}

export function InviteCodeModal({ roomId, onClose }: InviteCodeModalProps) {
  const titleId = useId();
  const inviteCodeState = useInviteCode(roomId);

  return (
    <Modal
      labelledBy={titleId}
      onClose={onClose}
      className="w-125 max-w-full gap-4"
    >
      <div className="flex w-full items-center justify-between">
        <h2 id={titleId} className="text-2xl leading-[normal]">
          초대코드
        </h2>
        <IconButton
          label="닫기"
          icon={CloseSvg}
          onClick={onClose}
          className="flex size-6 items-center justify-center"
        />
      </div>
      <div className="flex w-full flex-col gap-3.5">
        <p className="text-base leading-[normal] text-gray">
          친구에게 알려 주면 이 방에 들어올 수 있어요
        </p>
        <div className="flex h-20 w-full items-center justify-center rounded-2xl bg-white">
          <InviteCodeText state={inviteCodeState} />
        </div>
      </div>
      <CopyButton
        text={
          inviteCodeState.status === 'success'
            ? inviteCodeState.inviteCode
            : null
        }
        label="코드 복사하기"
        copiedAnnouncement="초대코드를 복사했어요"
        failedAnnouncement="초대코드를 복사하지 못했어요"
      />
    </Modal>
  );
}

// 상태별 분기는 한 곳에서 한다
function InviteCodeText({ state }: { state: InviteCodeState }) {
  switch (state.status) {
    case 'loading':
      return (
        <span aria-busy="true" className="text-base text-gray">
          불러오는 중
        </span>
      );
    case 'error':
      return (
        <span role="alert" className="text-base text-error">
          초대코드를 불러오지 못했어요
        </span>
      );
    case 'success':
      return (
        <span className="text-4xl tracking-[0.1em] [-webkit-text-stroke:1px_currentColor]">
          {state.inviteCode}
        </span>
      );
  }
}
