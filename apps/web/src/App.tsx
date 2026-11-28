import Home from './features/home/page';
import NotFound from './features/not-found/page';
import RoomPage from './features/pomodoro/room-page';
import { UnsupportedViewportNotice } from '@/components/UnsupportedViewportNotice';
import { PageViewportStage } from '@/components/PageViewportStage';
import { useExcludeFromSearch } from '@/hooks/useExcludeFromSearch';
import { resolveRoute } from '@/lib/resolve-route';

function App() {
  const route = resolveRoute(window.location.pathname);
  // 검색 결과에는 메인만 나온다. 화면 크기 안내로 페이지를 마운트하지 않아도 적용되도록 여기서 건다.
  useExcludeFromSearch(route !== 'home');

  if (route === 'pomodoro') {
    return <RoomPage />;
  }

  return (
    <PageViewportStage notice={renderNotice(route)}>
      {renderPage(route)}
    </PageViewportStage>
  );
}

type PageRoute = Exclude<ReturnType<typeof resolveRoute>, 'pomodoro'>;

function renderPage(route: PageRoute) {
  switch (route) {
    case 'home':
      return <Home />;
    case 'not-found':
      return <NotFound />;
  }
}

// 안내 화면에서는 페이지를 마운트하지 않으므로 배경만 따로 깐다
function renderNotice(route: PageRoute) {
  switch (route) {
    case 'home':
      return (
        <UnsupportedViewportNotice
          background={<div className="h-full w-full bg-[#FFFDF7]" />}
        />
      );
    case 'not-found':
      return <UnsupportedViewportNotice background={null} />;
  }
}

export default App;
