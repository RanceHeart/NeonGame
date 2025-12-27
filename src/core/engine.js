import { createInput } from './input.js';
import { createCamera } from './camera.js';

export function createEngine({ mountEl, scene }) {
  const cvsBg = document.createElement('canvas');
  const cvsMain = document.createElement('canvas');
  const bg = cvsBg.getContext('2d', { alpha: false });
  const main = cvsMain.getContext('2d', { alpha: true });

  mountEl.appendChild(cvsBg);
  mountEl.appendChild(cvsMain);

  const input = createInput({ targetEl: mountEl });
  const camera = createCamera();

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
    // 下面这些由 scene.init() 填充（比如 world, hud...）
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

    // 清屏（壳子：你可以换成你的背景系统）
    bg.fillStyle = '#050508';
    bg.fillRect(0, 0, screen.w, screen.h);
    main.clearRect(0, 0, screen.w, screen.h);

    // camera 开始（壳子：只做 shake 的 transform）
    camera.beginFrame(g);

    // 更新/渲染场景
    scene.update(g);
    scene.render(g);

    // camera 结束
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
      scene.init(g);
      requestAnimationFrame(tick);
    },
    stop() {
      running = false;
    },
    setScene(nextScene) {
      // 壳子：不做销毁，后面你可以扩展 scene.dispose()
      scene = nextScene;
      scene.init(g);
    },
  };
}
