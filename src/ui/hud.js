// src/ui/hud.js
export function createHud() {
  let rootEl = null;
  let stModeEl = null;
  let stGnEl = null;
  let targetEl = null;

  let btnNormal = null;
  let btnMarute = null;
  const weaponBtns = new Map();

  function setModeUI(mode) {
    if (stModeEl) {
      stModeEl.textContent = mode;
    }

    if (stGnEl) {
      if (mode === 'MARUTE') {
        stGnEl.textContent = 'TRANS-AM';
        stGnEl.classList.add('alert');
        document.body.style.boxShadow = 'inset 0 0 100px rgba(255,0,50,0.2)';
      } else {
        stGnEl.textContent = '100%';
        stGnEl.classList.remove('alert');
        document.body.style.boxShadow = 'none';
      }
    }

    if (btnNormal && btnMarute) {
      btnNormal.classList.toggle('m-active', mode === 'NORMAL');
      btnMarute.classList.toggle('m-marute', mode === 'MARUTE');
    }
  }

  function setWeaponUI(weapon) {
    for (const [k, el] of weaponBtns.entries()) {
      el.classList.toggle('active', k === weapon);
    }
  }

  function mount(g) {
    // 1) root overlay
    rootEl = document.createElement('div');
    rootEl.id = 'ui-layer';
    rootEl.innerHTML = `
      <div class="header">
        <div>
          <div style="color:var(--c-main); font-size:10px; font-weight:900;">GN-011 SVMS [MA MODE]</div>
          <h1>HARUTE <span style="font-size:14px; opacity:0.5; font-style:normal;">// FINAL MISSION</span></h1>
        </div>
        <div class="sys-status">
          <div>OUTPUT <span class="status-val" id="st-gn">100%</span></div>
          <div>MODE <span class="status-val" id="st-mode">NORMAL</span></div>
        </div>
      </div>

      <div class="controls">
        <div class="panel">
          <div class="panel-title">SYSTEM MODE</div>
          <div class="btn-group">
            <button id="btn-normal" class="m-active">CRUISE</button>
            <button id="btn-marute">MARUTE</button>
          </div>
        </div>

        <div class="panel">
          <div class="panel-title">WEAPON SELECT</div>
          <div class="btn-group">
            <button id="w-rifle" class="active">RIFLE</button>
            <button id="w-scissor">SCISSOR</button>
            <button id="w-missile">MISSILE</button>
            <button id="w-funnel">FUNNEL</button>
          </div>
        </div>
      </div>
    `;

    // 2) target reticle
    targetEl = document.createElement('div');
    targetEl.id = 'target';
    g.mountEl.appendChild(targetEl);

    // 3) wire refs
    stModeEl = rootEl.querySelector('#st-mode');
    stGnEl = rootEl.querySelector('#st-gn');

    btnNormal = rootEl.querySelector('#btn-normal');
    btnMarute = rootEl.querySelector('#btn-marute');

    weaponBtns.set('RIFLE', rootEl.querySelector('#w-rifle'));
    weaponBtns.set('SCISSOR', rootEl.querySelector('#w-scissor'));
    weaponBtns.set('MISSILE', rootEl.querySelector('#w-missile'));
    weaponBtns.set('FUNNEL', rootEl.querySelector('#w-funnel'));

    // 4) click handlers（只改 state + emit）
    btnNormal.addEventListener('click', () => {
      g.state.mode = 'NORMAL';
      setModeUI('NORMAL');
      g.events.emit('mode/change', { mode: 'NORMAL' });
    });

    btnMarute.addEventListener('click', () => {
      g.state.mode = 'MARUTE';
      setModeUI('MARUTE');
      g.events.emit('mode/change', { mode: 'MARUTE' });
    });

    for (const [weapon, el] of weaponBtns.entries()) {
      el.addEventListener('click', () => {
        g.state.weapon = weapon;
        setWeaponUI(weapon);
        g.events.emit('weapon/change', { weapon });
      });
    }

    // 5) mount to DOM
    g.mountEl.appendChild(rootEl);

    // init UI from state
    setModeUI(g.state.mode || 'NORMAL');
    setWeaponUI(g.state.weapon || 'RIFLE');
  }

  function unmount(g) {
    if (rootEl) {
      rootEl.remove();
      rootEl = null;
    }
    if (targetEl) {
      targetEl.remove();
      targetEl = null;
    }
  }

  function update(g) {
    // reticle follow pointer（不改你的 input，只用它）
    if (targetEl) {
      targetEl.style.left = `${g.input.pointer.x}px`;
      targetEl.style.top = `${g.input.pointer.y}px`;
      targetEl.classList.toggle('t-lock', g.input.pointer.down);
    }
  }

  return { mount, unmount, update };
}
