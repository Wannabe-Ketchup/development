import Home from './features/home/page';
import NotFound from './features/not-found/page';
import Pomodoro from './features/pomodoro/page';
import { RoomBackground } from './features/pomodoro/components/RoomBackground';
import { UnsupportedViewportNotice } from '@/components/UnsupportedViewportNotice';
import { ViewportStage } from '@/components/ViewportStage';
import { resolveRoute } from '@/lib/resolve-route';

function App() {
  const route = resolveRoute(window.location.pathname);
  return (
    <ViewportStage notice={renderNotice(route)}>
      {renderRoute(route)}
    </ViewportStage>
  );
}

function renderRoute(route: ReturnType<typeof resolveRoute>) {
  switch (route) {
    case 'home':
      return <Home />;
    case 'pomodoro':
      return <Pomodoro />;
    case 'not-found':
      return <NotFound />;
  }
}

// 안내 화면에서는 페이지를 마운트하지 않으므로(방에 입장하지 않게) 배경만 따로 깐다
function renderNotice(route: ReturnType<typeof resolveRoute>) {
  switch (route) {
    case 'home':
      return (
        <UnsupportedViewportNotice
          background={<div className="h-full w-full bg-[#FFFDF7]" />}
        />
      );
    case 'pomodoro':
      return (
        <UnsupportedViewportNotice
          background={<RoomBackground isDarkMode={false} />}
        />
      );
    case 'not-found':
      return <UnsupportedViewportNotice background={null} />;
  }
}

export default App;
