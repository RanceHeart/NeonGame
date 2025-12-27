// src/weapons/scissor.js
export function createScissorWeapon() {
  let lastSlashFrame = 0;

  return {
    name: 'SCISSOR',

    update(g, owner) {
      if (!g.input.pointer.down) {
        return;
      }

      const rate = g.state.mode === 'MARUTE' ? 5 : 15;
      if (g.time.frame - lastSlashFrame < rate) {
        return;
      }
      lastSlashFrame = g.time.frame;

      const bits = owner.funnelBits || [];
      if (bits.length === 0) {
        return;
      }

      // 随机挑一个 bit
      const bit = bits[Math.floor(Math.random() * bits.length)];
      if (!bit) {
        return;
      }

      const tx = g.input.pointer.x + (Math.random() - 0.5) * 100;
      const ty = g.input.pointer.y + (Math.random() - 0.5) * 100;

      const randAngle = Math.random() * Math.PI * 2;
      const dist = 250;

      const x1 = tx + Math.cos(randAngle) * dist;
      const y1 = ty + Math.sin(randAngle) * dist;
      const x2 = tx - Math.cos(randAngle) * dist;
      const y2 = ty - Math.sin(randAngle) * dist;

      const color = g.state.mode === 'MARUTE' ? '#ff003c' : '#00ffaa';

      bit.triggerSlash(g, x1, y1, x2, y2, color);
    },
  };
}
