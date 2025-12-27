export function createInput({ targetEl }) {
  const pointer = { x: 0, y: 0, down: false, justDown: false, justUp: false };

  const toLocal = (clientX, clientY) => {
    const r = targetEl.getBoundingClientRect();
    return { x: clientX - r.left, y: clientY - r.top };
  };

  const onDown = (x, y) => {
    const p = toLocal(x, y);
    pointer.x = p.x;
    pointer.y = p.y;
    pointer.down = true;
    pointer.justDown = true;
  };

  const onMove = (x, y) => {
    const p = toLocal(x, y);
    pointer.x = p.x;
    pointer.y = p.y;
  };

  const onUp = () => {
    pointer.down = false;
    pointer.justUp = true;
  };

  targetEl.addEventListener('mousedown', (e) => onDown(e.clientX, e.clientY));
  window.addEventListener('mousemove', (e) => onMove(e.clientX, e.clientY));
  window.addEventListener('mouseup', onUp);

  targetEl.addEventListener(
    'touchstart',
    (e) => {
      e.preventDefault();
      const t = e.touches[0];
      onDown(t.clientX, t.clientY);
    },
    { passive: false },
  );
  targetEl.addEventListener(
    'touchmove',
    (e) => {
      e.preventDefault();
      const t = e.touches[0];
      onMove(t.clientX, t.clientY);
    },
    { passive: false },
  );
  targetEl.addEventListener(
    'touchend',
    (e) => {
      e.preventDefault();
      onUp();
    },
    { passive: false },
  );

  function beginFrame() {
    pointer.justDown = false;
    pointer.justUp = false;
  }

  return { pointer, beginFrame };
}
