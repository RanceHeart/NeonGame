// src/ui/hud.js

/**
 * 创建 HUD（DOM Overlay）：
 * - 模式切换按钮（NORMAL / MARUTE）
 * - 武器切换按钮（RIFLE/SCISSOR/MISSILE/FUNNEL/CANNON）
 * - 目标准星 reticle 跟随 pointer
 * 注意：HUD 只负责改 g.state 并 emit，不直接控制游戏逻辑。
 * @returns {{ mount:(g:any)=>void, unmount:(g:any)=>void, update:(g:any)=>void }}
 */
export function createHud() {
  const hud = {
    rootEl: null,
    g: null,
    isVisible: false,

    mount(g) {
      if (hud.rootEl) return;
      hud.g = g;

      const mountEl = g.mountEl || g.ctx2d.main.canvas.parentElement;
      const root = document.createElement('div');
      root.id = 'ui-layer';
      root.style.display = 'none';

      // HTML Structure
      root.innerHTML = `
        <div class="header">
          <div>
            <h1>NEON OVERDRIVE</h1>
            <div class="sys-status">
              <div>SCENE <span class="status-val" data-hud-scene>SIM</span></div>
              <div>MODE  <span class="status-val" data-hud-mode>NORMAL</span></div>
              <div>WEAP  <span class="status-val" data-hud-weapon>RIFLE</span></div>
            </div>
          </div>

          <div class="panel" style="pointer-events: auto;">
            <div class="panel-title">System</div>
            <div class="btn-group">
              <button data-action="exit" style="border-color: #f33; color: #f33;">EXIT SIM</button>
            </div>
          </div>
        </div>

        <div class="controls">
          <div class="panel">
            <div class="panel-title">Mode</div>
            <div class="btn-group">
              <button data-mode="NORMAL">NORMAL</button>
              <button data-mode="MARUTE">MARUTE</button>
            </div>
          </div>

          <div class="panel">
            <div class="panel-title">Weapon</div>
            <div class="btn-group">
              <button data-weapon="RIFLE">RIFLE</button>
              <button data-weapon="MISSILE">MSL</button>
              <button data-weapon="FUNNEL">FUNNEL</button>
              <button data-weapon="SCISSOR">CUT</button>
              <button data-weapon="CANNON">RAIL</button>
            </div>
          </div>

          <div class="panel">
            <div class="panel-title">Boss Phase</div>
            <div class="btn-group">
              <button data-boss-phase="0">P0</button>
              <button data-boss-phase="1">P1</button>
              <button data-boss-phase="2">P2</button>
            </div>
          </div>
        </div>

        <div class="instruction">
          Tap buttons. Hold pointer to fire.
        </div>
      `;

      mountEl.appendChild(root);
      hud.rootEl = root;

      // --- Bind Events ---

      // Exit Button Logic
      const exitBtn = root.querySelector('[data-action="exit"]');
      if (exitBtn) {
        exitBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          if (g.events?.emit) {
            g.events.emit('scene.set', 'menu');
          }
        });
      }

      // State Buttons Logic
      const bindState = (selector, key, isNum = false) => {
        root.querySelectorAll(selector).forEach((btn) => {
          btn.addEventListener('click', () => {
            const val = btn.getAttribute(selector.slice(1, -1));
            if (!val) return;
            if (!g.state) g.state = {};
            g.state[key] = isNum ? Number(val) : val;
            hud.sync();
          });
        });
      };

      bindState('[data-mode]', 'mode');
      bindState('[data-weapon]', 'weapon');
      bindState('[data-boss-phase]', 'bossPhase', true);
    },

    show() {
      if (hud.rootEl) {
        hud.rootEl.style.display = 'flex';
        hud.isVisible = true;
        hud.sync();
      }
    },

    hide() {
      if (hud.rootEl) {
        hud.rootEl.style.display = 'none';
        hud.isVisible = false;
      }
    },

    update(g) {
      if (g.time.frame % 10 === 0 && hud.isVisible) {
        hud.sync();
      }
    },

    sync() {
      if (!hud.rootEl || !hud.g) return;
      const g = hud.g;

      // Changed default back to 'sandbox'
      const currentScene = g.state.activeScene || 'sandbox';
      const currentMode = g.state.mode || 'NORMAL';
      const currentWeapon = g.state.weapon || 'RIFLE';
      const currentPhase = g.state.bossPhase || 0;

      const sceneDisplay = hud.rootEl.querySelector('[data-hud-scene]');
      if (sceneDisplay) sceneDisplay.textContent = currentScene.toUpperCase();

      const modeDisplay = hud.rootEl.querySelector('[data-hud-mode]');
      if (modeDisplay) modeDisplay.textContent = currentMode;

      const weapDisplay = hud.rootEl.querySelector('[data-hud-weapon]');
      if (weapDisplay) weapDisplay.textContent = currentWeapon;

      const toggle = (sel, conditionFn) => {
        hud.rootEl.querySelectorAll(sel).forEach((btn) => {
          const val = btn.getAttribute(sel.slice(1, -1));
          const active = conditionFn(val);
          btn.classList.toggle('active', active);

          if (sel === '[data-mode]') {
            btn.classList.toggle('m-marute', val === 'MARUTE' && active);
            btn.classList.toggle('m-active', val !== 'MARUTE' && active);
          }
        });
      };

      toggle('[data-mode]', (v) => v === currentMode);
      toggle('[data-weapon]', (v) => v === currentWeapon);
      toggle('[data-boss-phase]', (v) => Number(v) === currentPhase);
    },
  };

  return hud;
}
