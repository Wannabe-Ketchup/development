import { RoomViewportStage } from '@/components/RoomViewportStage';
import { CompactPomodoro } from './compact-page';
import { useRoomSession } from './hooks/useRoomSession';
import Pomodoro from './page';

// 방 경로의 진입점. 입장과 실시간 연결을 화면 분기 위에서 한 번만 맺어, 창 크기가 바뀌어도 다시 입장하지 않는다
function RoomPage() {
  const session = useRoomSession();

  return (
    <RoomViewportStage
      renderCompact={(layout) => (
        <CompactPomodoro layout={layout} session={session} />
      )}
    >
      <Pomodoro session={session} />
    </RoomViewportStage>
  );
}

export default RoomPage;
