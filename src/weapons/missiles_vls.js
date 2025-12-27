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

      const count = g.state.mode === 'MARUTE' ? 4 : 2;

      for (let i = 0; i < count; i++) {
        const idx = owner.vlsIndex;
        owner.vlsIndex = (owner.vlsIndex + 1) % 16;

        // --- 新增：记录开火状态用于视觉 Flash ---
        owner.lastFiredVlsIndex = idx;
        owner.lastFiredFrame = g.time.frame;
        // ------------------------------------

        const side = idx < 8 ? -1 : 1;
        const localIdx = idx % 8;
        const row = Math.floor(localIdx / 2);
        const col = localIdx % 2;

        const binderXOffset = 45 + owner.transformFactor * 25;
        const cellCenterRelX = -8 + col * 10 + 4;
        const cellCenterRelY = -45 + row * 12 + 5;

        const ox = owner.x + side * binderXOffset + side * cellCenterRelX;
        const oy = owner.y + cellCenterRelY;

        const color = g.state.mode === 'MARUTE' ? '#ff003c' : '#ffaa00';

        g.spawn.projectile({
          type: 'missile',
          from: 'player',
          x: ox,
          y: oy,
          vx: (Math.random() - 0.5) * 10 + side * 5,
          vy: -5 - Math.random() * 10,
          tx: g.input.pointer.x,
          ty: g.input.pointer.y,
          marute: g.state.mode === 'MARUTE',
          life: 300,
          state: 'EJECT',
          timer: 10 + Math.random() * 10,
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
