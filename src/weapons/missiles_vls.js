// src/weapons/missiles_vls.js
export function createVlsMissiles() {
  return {
    name: 'MISSILE',

    update(g, owner) {
      if (!g.input.pointer.down) {
        return;
      }

      const rate = g.state.mode === 'MARUTE' ? 2 : 4;
      if (g.time.frame % rate !== 0) {
        return;
      }

      const count = g.state.mode === 'MARUTE' ? 4 : 1;

      for (let i = 0; i < count; i++) {
        const idx = owner.vlsIndex;
        owner.vlsIndex = (owner.vlsIndex + 1) % 32;

        const side = idx < 16 ? -1 : 1;
        const localIdx = idx % 16;
        const row = Math.floor(localIdx / 2);
        const col = localIdx % 2;

        const binderXOffset = 45 + owner.transformFactor * 25;
        const startX = -14;
        const startY = -50;
        const cellW = 8;

        const cellX = startX + col * (cellW + 2);
        const cellY = startY + row * 12;

        const ox = owner.x + side * binderXOffset + side * cellX;
        const oy = owner.y + cellY;

        const color = g.state.mode === 'MARUTE' ? '#ff003c' : '#ffaa00';

        g.spawn.projectile({
          type: 'missile',
          from: 'player',
          x: ox,
          y: oy,

          // eject wide spread
          vx: (Math.random() - 0.5) * 25,
          vy: -5 - Math.random() * 15,

          // missile guidance params
          tx: g.input.pointer.x,
          ty: g.input.pointer.y,
          marute: g.state.mode === 'MARUTE',
          life: 300,
          state: 'EJECT',
          timer: 5 + Math.random() * 15,
          speed: 0,
          maxSpeed: 20 + Math.random() * 10,
          curveBias: (Math.random() - 0.5) * 0.2,
          angle: -Math.PI / 2,

          color,
        });
      }
    },
  };
}
