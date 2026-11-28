import Home from './features/home/page';
import NotFound from './features/not-found/page';
import RoomPage from './features/pomodoro/room-page';
import { useExcludeFromSearch } from '@/hooks/useExcludeFromSearch';
import { resolveRoute } from '@/lib/resolve-route';

function App() {
  const route = resolveRoute(window.location.pathname);
  // 검색 결과에는 메인만 나온다
  useExcludeFromSearch(route !== 'home');

  switch (route) {
    case 'pomodoro':
      return <RoomPage />;
    case 'home':
      return <Home />;
    case 'not-found':
      return <NotFound />;
  }
}

export default App;
