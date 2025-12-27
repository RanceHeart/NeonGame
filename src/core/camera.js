export function createCamera() {
  const cam = {
    shake: 0,
    shakeX: 0,
    shakeY: 0,
    addShake(v) {
      cam.shake = Math.max(cam.shake, v);
    },
    beginFrame(g) {
      // TODO: 更精细的 camera（zoom/kick）
      cam.shakeX = (Math.random() - 0.5) * cam.shake;
      cam.shakeY = (Math.random() - 0.5) * cam.shake;
      cam.shake *= 0.9;

      g.ctx2d.main.save();
      g.ctx2d.main.translate(cam.shakeX, cam.shakeY);
    },
    endFrame(g) {
      g.ctx2d.main.restore();
    },
  };

  return cam;
}
