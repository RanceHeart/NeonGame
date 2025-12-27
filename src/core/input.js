// src/core/input.js
export function createInput({ targetEl }) {
  const pointer = { x: 0, y: 0, down: false, justDown: false, justUp: false };
  const keys = {}; // Store keyboard state

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

  // Pointer Events
  targetEl.addEventListener('mousedown', (e) => onDown(e.clientX, e.clientY));
  window.addEventListener('mousemove', (e) => onMove(e.clientX, e.clientY));
  window.addEventListener('mouseup', onUp);

  targetEl.addEventListener(
    'touchstart',
    (e) => {
      if (e.cancelable) e.preventDefault();
      const t = e.touches[0];
      onDown(t.clientX, t.clientY);
    },
    { passive: false },
  );
  targetEl.addEventListener(
    'touchmove',
    (e) => {
      if (e.cancelable) e.preventDefault();
      const t = e.touches[0];
      onMove(t.clientX, t.clientY);
    },
    { passive: false },
  );
  targetEl.addEventListener(
    'touchend',
    (e) => {
      if (e.cancelable) e.preventDefault();
      onUp();
    },
    { passive: false },
  );

  // --- Keyboard Support Added ---
  window.addEventListener('keydown', (e) => {
    keys[e.code] = true;
    keys[e.key] = true; // Support both 'KeyW' and 'w'
  });
  window.addEventListener('keyup', (e) => {
    keys[e.code] = false;
    keys[e.key] = false;
  });

  function beginFrame() {
    pointer.justDown = false;
    pointer.justUp = false;
  }

  return { pointer, keys, beginFrame };
}
