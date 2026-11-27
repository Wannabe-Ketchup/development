// 폰 Safari는 상태 표시줄과 주소창 뒤를 화면 위·아래 끝에 붙은 고정 요소의 배경색으로 칠한다.
// 그 색이 벽·바닥과 이어지도록 끝에 색 띠를 두고, 배경 이미지로 덮는다(색은 index.css room-edge-*).
// 모달·사용 안내가 열리면 띠 색도 함께 어두워진다
export function BrowserEdgeStrips() {
  return (
    <>
      <div
        aria-hidden="true"
        className="fixed inset-x-0 top-0 h-12 room-edge-top"
      />
      <div
        aria-hidden="true"
        className="fixed inset-x-0 bottom-0 h-12 room-edge-bottom"
      />
    </>
  );
}
