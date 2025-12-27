export function createRifleWeapon() {
  let cooldown = 0;

  return {
    name: 'RIFLE',
    update(g, owner) {
      // TODO: 根据 g.input.pointer.down 触发
      if (cooldown > 0) {
        cooldown -= 1;
        return;
      }

      // 壳子：点按/按住就发射一个“projectile”
      if (g.input.pointer.down) {
        cooldown = 6;

        // 注意：模块永远只用 g.spawn，不要直接 push 数组
        g.spawn.projectile({
          type: 'bullet',
          from: 'player',
          x: owner.x,
          y: owner.y - 30,
          vx: 0,
          vy: -16,
          life: 120,
          color: '#0ff',
        });

        g.camera.addShake(2);
      }
    },
  };
}
