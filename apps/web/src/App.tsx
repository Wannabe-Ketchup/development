import Home from './features/home/page';
import Pomodoro from './features/pomodoro/page';
import { useRoomId } from '@/lib/room-id';

function App() {
  const roomId = useRoomId();

  return roomId ? <Pomodoro /> : <Home />;
}

export default App;
