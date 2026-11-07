import Home from './features/home/page';
import NotFound from './features/not-found/page';
import Pomodoro from './features/pomodoro/page';
import { resolveRoute } from '@/lib/resolve-route';

function App() {
  const route = resolveRoute(window.location.pathname);
  switch (route) {
    case 'home':
      return <Home />;
    case 'pomodoro':
      return <Pomodoro />;
    case 'not-found':
      return <NotFound />;
  }
}

export default App;
