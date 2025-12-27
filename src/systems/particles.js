// src/systems/particles.js
export function createParticleSystem() {
  const list = [];

  function spawn(p) {
    list.push({ life: 1, ...p });
  }

  function update(g) {
    for (const p of list) {
      if (p.dead) {
        continue;
      }

      if (p.type === 'beam_trail') {
        p.vx = (p.vx || 0) * 0.9;
        p.vy = (p.vy || 0) * 0.9;
        p.size = p.size || Math.random() * 5;
        p.decay = p.decay || 0.05;
      }

      if (p.type === 'gn_smoke') {
        p.size = p.size || 4 + Math.random() * 6;
        p.decay = p.decay || 0.04;
        p.vx = (p.vx || (Math.random() - 0.5) * 10) * 0.05;
        p.vy = (p.vy || (Math.random() - 0.5) * 10) * 0.05;
        p.size *= 0.94;
      }

      if (p.type === 'scissor_trail') {
        // 细弱尾线：衰减慢一点，但 alpha 很低
        p.decay = p.decay || 0.08; // 越大消失越快
        p.width = p.width || 2;
        p.vx = 0;
        p.vy = 0;
      }

      if (p.type === 'spark') {
        if (p.vx === undefined) {
          p.vx = (Math.random() - 0.5) * 10;
          p.vy = (Math.random() - 0.5) * 10;
          p.size = Math.random() * 3;
          p.decay = 0.02 + Math.random() * 0.03;
        }
      }

      if (p.type === 'explosion') {
        p.decay = p.decay || 0.1;
        p.size = p.size || 20;
      }

      if (p.type === 'slash') {
        p.decay = p.decay || 0.15;
      }

      p.x += p.vx || 0;
      p.y += p.vy || 0;
      p.life -= p.decay || 0.03;

      if (p.life <= 0) {
        p.dead = true;
      }
    }

    for (let i = list.length - 1; i >= 0; i--) {
      if (list[i].dead) {
        list.splice(i, 1);
      }
    }
  }

  function render(g) {
    const ctx = g.ctx2d.main;

    for (const p of list) {
      if (p.type === 'shockwave') {
        ctx.save();
        ctx.globalAlpha = p.life;
        ctx.strokeStyle = p.color || '#fff';
        ctx.lineWidth = (p.width || 4) * p.life;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
        continue;
      }

      if (p.type === 'electric_arc') {
        ctx.save();
        ctx.globalAlpha = p.life;
        ctx.strokeStyle = p.color || '#fff';
        ctx.lineWidth = 2;
        ctx.shadowBlur = 5;
        ctx.shadowColor = p.color;

        const segments = 3;
        const jagged = 10;
        const angle = Math.random() * Math.PI * 2;

        ctx.beginPath();
        ctx.moveTo(
          p.x - (Math.cos(angle) * p.size) / 2,
          p.y - (Math.sin(angle) * p.size) / 2,
        );
        for (let k = 0; k < segments; k++) {
          ctx.lineTo(
            p.x +
              (Math.random() - 0.5) * p.size +
              (Math.random() - 0.5) * jagged,
            p.y +
              (Math.random() - 0.5) * p.size +
              (Math.random() - 0.5) * jagged,
          );
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.restore();
        continue;
      }

      if (p.type === 'explosion') {
        ctx.save();
        ctx.globalAlpha = p.life;
        ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = p.color || '#fff';
        ctx.beginPath();
        ctx.arc(p.x, p.y, (p.size || 20) * (1.2 - p.life), 0, Math.PI * 2);
        ctx.fill();
        ctx.globalCompositeOperation = 'source-over';
        ctx.restore();
        continue;
      }


      if (p.type === 'slash') {
        ctx.save();
        ctx.globalAlpha = p.life;
        ctx.strokeStyle = p.color || '#0ff';
        ctx.lineWidth = (p.thick || 4) * p.life;
        ctx.shadowBlur = 15;
        ctx.shadowColor = p.color || '#0ff';
        ctx.beginPath();
        ctx.moveTo(p.x1, p.y1);
        ctx.lineTo(p.x2, p.y2);
        ctx.stroke();
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#fff';
        ctx.shadowBlur = 0;
        ctx.stroke();
        ctx.restore();
        continue;
      }

      if (p.type === 'scissor_trail') {
        const ctx = g.ctx2d.main;

        ctx.save();
        // 很弱：alpha 低 + 线宽跟 life 衰减
        ctx.globalAlpha = Math.max(0, p.life) * 0.18;
        ctx.strokeStyle = p.color || '#00ffaa';
        ctx.lineWidth = (p.width || 2) * Math.max(0.2, p.life);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // 不要强光晕，最多给一点点
        ctx.shadowBlur = 6;
        ctx.shadowColor = p.color || '#00ffaa';

        ctx.beginPath();
        ctx.moveTo(p.x1, p.y1);
        ctx.lineTo(p.x2, p.y2);
        ctx.stroke();

        ctx.shadowBlur = 0;
        ctx.restore();
        continue;
      }


      ctx.save();
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.color || '#fff';

      if (p.type === 'gn_smoke') {
        ctx.globalCompositeOperation = 'screen';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size || 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalCompositeOperation = 'source-over';
      } else {
        const s = p.size || 2;
        ctx.fillRect(p.x, p.y, s, s);
      }
      ctx.restore();
    }
  }

  return { spawn, update, render, list };
}
