import { useCallback, useEffect, useState } from 'react';
import type { ChatMessage, Room } from '@pomodoro/shared';
import { enterRoom } from '@/api/room';
import { useRoomId } from '@/lib/room-id';
import { useChatMessageForm, type ChatMessageForm } from './useChatMessageForm';
import { useChatMessages } from './useChatMessages';
import { useNotificationPermission } from './useNotificationPermission';
import { useRoomSSE, type RoomStateChange, type SSEStatus } from './useRoomSSE';
import { useSessionChangeAlarm } from './useSessionChangeAlarm';
import { useSessionChangeNotification } from './useSessionChangeNotification';
import { useTabTitle } from './useTabTitle';

export interface RoomSession {
  roomId: string | null;
  room: Room | null;
  selfParticipantId: string | null;
  isConfirmed: boolean;
  hasEnterRoomFailed: boolean;
  sseStatus: SSEStatus;
  canShowTour: boolean;
  chat: RoomChat;
}

// 채팅 상태. 화면(데스크톱·좁은 화면)이 바뀌어도 메시지·쓰던 내용·보내는 중인 상태·읽은 위치가 남도록 세션이 들고 있다
export interface RoomChat {
  messages: ChatMessage[];
  // 첫 chat_history의 마지막 번호. 아직 못 받았으면 null
  firstHistoryLastId: number | null;
  addChatMessage: (message: ChatMessage) => void;
  // 쓰던 내용과 전송 상태. 보내는 중이거나 보내지 못한 메시지의 clientMessageId도 여기 있어, 화면이 바뀌어도 같은 메시지를 두 번 보내지 않는다
  form: ChatMessageForm;
  // 채팅창을 닫을 때까지 본 마지막 번호
  lastClosedId: number;
  changeLastClosedId: (id: number) => void;
}

// 데스크톱·좁은 화면이 같이 쓰는 방 상태. 입장, 실시간 연결, 세션 변경 알림, 탭 제목, 채팅 상태를 한곳에서 관리한다.
// 화면이 바뀌어도 다시 입장하지 않도록 화면 분기 위(RoomPage)에서 한 번만 부른다.
export function useRoomSession(): RoomSession {
  const roomId = useRoomId();

  const [room, setRoom] = useState<Room | null>(null);
  const [selfParticipantId, setSelfParticipantId] = useState<string | null>(
    null,
  );
  // 마지막으로 받은 방 상태가 리셋으로 바뀐 것인지. 세션 변경 알림을 건너뛰는 데 쓴다
  const [isLastChangeReset, setIsLastChangeReset] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [hasEnterRoomFailed, setHasEnterRoomFailed] = useState(false);

  useEffect(() => {
    if (!roomId) return;

    let cancelled = false;

    enterRoom(roomId)
      .then((response) => {
        if (cancelled) return;
        setSelfParticipantId(response.participant.id);
        setRoom(response.room);
      })
      .catch(() => {
        if (!cancelled) setHasEnterRoomFailed(true);
      });

    return () => {
      cancelled = true;
    };
  }, [roomId]);

  // 방 상태와 리셋 여부를 같은 렌더에 반영해야 세션 변경 훅이 둘을 맞춰 본다
  const handleRoomState = useCallback(
    (nextRoom: Room, change: RoomStateChange) => {
      setRoom(nextRoom);
      setIsLastChangeReset(change.isReset);
      setIsConfirmed(true);
    },
    [],
  );

  const {
    messages: chatMessages,
    firstHistoryLastId,
    addChatMessage,
    addChatHistory,
  } = useChatMessages();

  const chatForm = useChatMessageForm({ roomId, onSent: addChatMessage });
  const [lastClosedId, setLastClosedId] = useState(0);

  const { status: sseStatus } = useRoomSSE(
    roomId ?? undefined,
    selfParticipantId !== null,
    handleRoomState,
    addChatMessage,
    addChatHistory,
  );

  useSessionChangeAlarm(room?.mode, room?.currentCycle, isLastChangeReset);

  // 방 상태를 믿을 수 있을 때만 탭 제목과 브라우저 알림에 쓴다
  const isRoomLive =
    !!roomId && !!room && !hasEnterRoomFailed && sseStatus !== 'error';
  const liveRoom = isRoomLive ? room : null;

  useNotificationPermission();
  useSessionChangeNotification(
    liveRoom?.roomId,
    liveRoom?.mode,
    liveRoom?.currentCycle,
    isLastChangeReset,
    liveRoom?.timer.timerStartedAt,
  );
  useTabTitle(liveRoom);

  const canShowTour =
    !!roomId &&
    !!room &&
    !!selfParticipantId &&
    isConfirmed &&
    !hasEnterRoomFailed &&
    sseStatus !== 'error';

  return {
    roomId,
    room,
    selfParticipantId,
    isConfirmed,
    hasEnterRoomFailed,
    sseStatus,
    canShowTour,
    chat: {
      messages: chatMessages,
      firstHistoryLastId,
      addChatMessage,
      form: chatForm,
      lastClosedId,
      changeLastClosedId: setLastClosedId,
    },
  };
}
