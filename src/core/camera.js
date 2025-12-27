// src/core/camera.js
export function createCamera() {
  const cam = {
    shake: 0,
    shakeX: 0,
    shakeY: 0,
    zoom: 1.0,
    targetZoom: 1.0,

    addShake(v) {
      cam.shake = Math.max(cam.shake, v);
    },

    setZoom(v) {
      // Clamp zoom level between 0.5x (Macro) and 2.0x (Close-up)
      cam.targetZoom = Math.max(0.5, Math.min(2.0, v));
    },

    beginFrame(g) {
      // Smooth zoom transition
      cam.zoom += (cam.targetZoom - cam.zoom) * 0.1;

      cam.shakeX = (Math.random() - 0.5) * cam.shake;
      cam.shakeY = (Math.random() - 0.5) * cam.shake;
      cam.shake *= 0.9;

      const ctx = g.ctx2d.main;
      ctx.save();

      // Center pivot for scaling
      const cx = g.screen.w / 2;
      const cy = g.screen.h / 2;

      ctx.translate(cx, cy);
      ctx.scale(cam.zoom, cam.zoom);
      ctx.translate(-cx, -cy);

      // Apply shake
      ctx.translate(cam.shakeX, cam.shakeY);
    },

    endFrame(g) {
      g.ctx2d.main.restore();
    },
  };

  return cam;
}
