// ResizeObserver Mocking (Vitest JSDOM 환경용)
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// HTMLDialogElement Mocking (jsdom 30에는 showModal/show/close가 없다)
// node 환경 테스트(프리렌더 등)에는 DOM이 없으므로 건너뛴다
if (typeof HTMLDialogElement !== 'undefined') {
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.setAttribute('open', '');
  };
  HTMLDialogElement.prototype.show = function show() {
    this.setAttribute('open', '');
  };
  HTMLDialogElement.prototype.close = function close() {
    if (!this.hasAttribute('open')) return;
    this.removeAttribute('open');
    this.dispatchEvent(new Event('close'));
  };
}
