// src/weapons/scissor.js
export function createScissorWeapon() {
  return {
    name: 'SCISSOR',
    update(g, owner) {
      // 逻辑已全部移交至 Scissor Bit Entity 内部 (src/entities/player/scissor_bit.js)
      // Bit 会自行检测: if (g.state.weapon === 'SCISSOR' && g.input.pointer.down) -> HUNT
    },
  };
}
