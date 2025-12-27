// src/core/input.js
export function createInput({ targetEl }) {
  const pointer = { x: 0, y: 0, down: false, justDown: false, justUp: false };

  const keys = {};
  const keysJustDown = {};
  const keysJustUp = {};

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

  targetEl.addEventListener('mousedown', (e) => {
    onDown(e.clientX, e.clientY);
  });
  window.addEventListener('mousemove', (e) => {
    onMove(e.clientX, e.clientY);
  });
  window.addEventListener('mouseup', () => {
    onUp();
  });

  targetEl.addEventListener(
    'touchstart',
    (e) => {
      if (e.cancelable) {
        e.preventDefault();
      }
      const t = e.touches[0];
      onDown(t.clientX, t.clientY);
    },
    { passive: false },
  );
  targetEl.addEventListener(
    'touchmove',
    (e) => {
      if (e.cancelable) {
        e.preventDefault();
      }
      const t = e.touches[0];
      onMove(t.clientX, t.clientY);
    },
    { passive: false },
  );
  targetEl.addEventListener(
    'touchend',
    (e) => {
      if (e.cancelable) {
        e.preventDefault();
      }
      onUp();
    },
    { passive: false },
  );

  window.addEventListener('keydown', (e) => {
    const code = e.code || e.key;

    if (!keys[code]) {
      keysJustDown[code] = true;
    }

    keys[code] = true;

    // 兼容 e.key 直接访问（你之前就这么做）
    if (e.key && !keys[e.key]) {
      keysJustDown[e.key] = true;
      keys[e.key] = true;
    }
  });

  window.addEventListener('keyup', (e) => {
    const code = e.code || e.key;

    keys[code] = false;
    keysJustUp[code] = true;

    if (e.key) {
      keys[e.key] = false;
      keysJustUp[e.key] = true;
    }
  });

  function beginFrame() {
    pointer.justDown = false;
    pointer.justUp = false;

    for (const k in keysJustDown) {
      delete keysJustDown[k];
    }
    for (const k in keysJustUp) {
      delete keysJustUp[k];
    }
  }

  return { pointer, keys, keysJustDown, keysJustUp, beginFrame };
}
