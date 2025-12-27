// src/core/engine.js
import { createInput } from './input.js';
import { createCamera } from './camera.js';
import { createEvents } from './events.js';

export function createEngine({ mountEl, scene }) {
  let sceneRef = scene;

  const cvsBg = document.createElement('canvas');
  const cvsMain = document.createElement('canvas');
  const bg = cvsBg.getContext('2d', { alpha: false });
  const main = cvsMain.getContext('2d', { alpha: true });

  mountEl.appendChild(cvsBg);
  mountEl.appendChild(cvsMain);

  const input = createInput({ targetEl: mountEl });
  const camera = createCamera();
  const events = createEvents();

  const screen = { w: 0, h: 0 };
  const time = { frame: 0, dt: 0, now: 0, prev: 0 };

  function resize() {
    const rect = mountEl.getBoundingClientRect();
    screen.w = Math.max(1, Math.floor(rect.width));
    screen.h = Math.max(1, Math.floor(rect.height));

    cvsBg.width = screen.w;
    cvsBg.height = screen.h;
    cvsMain.width = screen.w;
    cvsMain.height = screen.h;
  }
  window.addEventListener('resize', resize);
  resize();

  const g = {
    ctx2d: { bg, main },
    screen,
    time,
    input,
    camera,
    events,
    state: {},
  };

  let running = false;

  function tick(ts) {
    if (!running) {
      return;
    }

    if (!time.prev) {
      time.prev = ts;
    }
    time.now = ts;
    time.dt = Math.min(0.05, (ts - time.prev) / 1000);
    time.prev = ts;

    // input frame flags reset
    g.input.beginFrame();

    bg.fillStyle = '#050508';
    bg.fillRect(0, 0, screen.w, screen.h);
    main.clearRect(0, 0, screen.w, screen.h);

    camera.beginFrame(g);

    sceneRef.update(g);
    sceneRef.render(g);

    camera.endFrame(g);

    time.frame += 1;
    requestAnimationFrame(tick);
  }

  return {
    start() {
      if (running) {
        return;
      }
      running = true;
      sceneRef.init(g);
      requestAnimationFrame(tick);
    },
    stop() {
      running = false;
    },
    setScene(nextScene) {
      sceneRef = nextScene;
      sceneRef.init(g);
    },
  };
}
