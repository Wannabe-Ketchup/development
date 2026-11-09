import { useEffect, useId, useRef } from 'react';
import { WobblyBox } from '@squiggle-line/react';
import CloseSvg from '@/assets/close.svg?react';
import { IconButton } from '@/components/IconButton';
import { useCopyToClipboard } from '../hooks/useCopyToClipboard';
import { useInviteCode, type InviteCodeState } from '../hooks/useInviteCode';

// 배경색은 안쪽 요소에 CSS로 칠하고 WobblyBox는 테두리만 그린다.
// 테두리 svg는 크기를 잰 뒤에야 그려지므로, 그 전에도 배경과 글자가 함께 보이게 하기 위해서다
const WOBBLY_STROKE_CLASS_NAME = 'fill-none stroke-black';

const OUTER_WOBBLY = {
  wiggle: 4,
  frequency: 360,
  smoothen: 10,
  strokeWidth: 4,
  borderRadius: 32,
  pathClassName: WOBBLY_STROKE_CLASS_NAME,
};

const COPY_BUTTON_WOBBLY = {
  wiggle: 16,
  frequency: 360,
  smoothen: 10,
  strokeWidth: 4,
  borderRadius: 100,
  pathClassName: WOBBLY_STROKE_CLASS_NAME,
};

interface InviteCodeModalProps {
  roomId: string;
  onClose: () => void;
}

export function InviteCodeModal({ roomId, onClose }: InviteCodeModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const isBackdropPressRef = useRef(false);
  const titleId = useId();
  const inviteCodeState = useInviteCode(roomId);

  // 마운트되면 모달로 연다. StrictMode 이중 실행 대비로 open을 확인한다.
  // 언마운트하면 DOM에서 빠지며 top layer에서도 사라지므로 cleanup에서 close()하지 않는다
  // (close()는 비동기 close 이벤트로 onClose를 불러, 재실행된 effect가 연 모달을 닫아 버린다)
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || dialog.open) return;
    dialog.showModal();
  }, []);

  return (
    // oxlint-disable-next-line jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/click-events-have-key-events -- 바깥 클릭 닫기. 키보드는 dialog 기본 Esc가 담당
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      className="m-auto overflow-visible bg-transparent p-0 backdrop:bg-black/32"
      onClose={onClose} // Esc(cancel→close)로 닫힌 것을 상태와 동기화
      onPointerDown={(e) => {
        isBackdropPressRef.current = e.target === e.currentTarget;
      }}
      onPointerUp={(e) => {
        // 바깥에서 눌렀어도 안쪽에서 떼면 닫지 않는다 (click은 공통 조상인 dialog로 오기 때문)
        if (e.target !== e.currentTarget) isBackdropPressRef.current = false;
      }}
      onClick={(e) => {
        if (isBackdropPressRef.current && e.target === e.currentTarget)
          onClose();
      }}
    >
      <WobblyBox {...OUTER_WOBBLY}>
        <div className="flex w-125 max-w-full flex-col gap-4 rounded-[32px] bg-cream px-9 py-7">
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
          <CopyInviteCodeButton
            inviteCode={
              inviteCodeState.status === 'success'
                ? inviteCodeState.inviteCode
                : null
            }
          />
        </div>
      </WobblyBox>
    </dialog>
  );
}

interface CopyInviteCodeButtonProps {
  // 아직 없으면(불러오는 중, 실패) null. 이때 버튼은 비활성화된다
  inviteCode: string | null;
}

function CopyInviteCodeButton({ inviteCode }: CopyInviteCodeButtonProps) {
  const { copyStatus, copy } = useCopyToClipboard();

  const label = {
    idle: '코드 복사하기',
    copied: '복사했어요!',
    failed: '복사하지 못했어요',
  }[copyStatus];
  const announcement = {
    idle: '',
    copied: '초대코드를 복사했어요',
    failed: '초대코드를 복사하지 못했어요',
  }[copyStatus];

  return (
    <>
      <WobblyBox {...COPY_BUTTON_WOBBLY} className="w-full">
        <button
          type="button"
          disabled={inviteCode === null}
          onClick={() => {
            if (inviteCode !== null) void copy(inviteCode);
          }}
          className="flex h-15 w-full items-center justify-center rounded-full bg-tomato-body-4 text-2xl text-white disabled:cursor-default disabled:opacity-50"
        >
          {label}
        </button>
      </WobblyBox>
      {/* 버튼 이름 변경을 읽지 않는 스크린 리더를 위해 결과를 따로 발화한다 */}
      <output className="sr-only">{announcement}</output>
    </>
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
