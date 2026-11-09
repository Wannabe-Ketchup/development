// ResizeObserver Mocking (Vitest JSDOM 환경용)
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// HTMLDialogElement Mocking (jsdom 30에는 showModal/show/close가 없다)
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
