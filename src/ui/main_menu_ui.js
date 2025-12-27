// src/ui/main_menu_ui.js
export function createMainMenuUI() {
  const ui = {
    rootEl: null,
    g: null,

    mount(g) {
      if (ui.rootEl) return;
      ui.g = g;

      const mountEl = g.mountEl || g.ctx2d.main.canvas.parentElement;
      const root = document.createElement('div');
      root.style.position = 'absolute';
      root.style.inset = '0';
      root.style.display = 'none';
      root.style.flexDirection = 'column';
      root.style.justifyContent = 'center';
      root.style.alignItems = 'center';
      root.style.background = 'rgba(5, 5, 8, 0.85)';
      root.style.backdropFilter = 'blur(5px)';
      root.style.zIndex = '100';

      // CSS for buttons
      const btnStyle = `
        width: 240px;
        padding: 15px;
        margin: 10px;
        background: rgba(0, 0, 0, 0.6);
        border: 1px solid #445;
        color: #fff;
        font-family: 'Segoe UI', monospace;
        font-size: 14px;
        font-weight: 900;
        letter-spacing: 2px;
        text-transform: uppercase;
        cursor: pointer;
        transition: all 0.2s;
        text-align: center;
        position: relative;
        overflow: hidden;
      `;

      root.innerHTML = `
        <div style="margin-bottom: 50px; text-align: center;">
          <h1 style="
            font-family: monospace; 
            font-size: 64px; 
            color: #fff; 
            margin: 0; 
            text-shadow: 0 0 20px #ff9500;
            font-style: italic;
            letter-spacing: -3px;
          ">NEON OVERDRIVE</h1>
          <div style="color: #00ffaa; letter-spacing: 5px; font-size: 12px; margin-top: 10px;">
            SYSTEM READY // WAITING FOR PILOT
          </div>
        </div>

        <div style="display: flex; flex-direction: column;">
          <button id="btn-sandbox" style="${btnStyle}">
            <span style="color: #ff9500;">></span> Sandbox Mode
          </button>
          
          <button id="btn-codex" style="${btnStyle}">
            <span style="color: #00ffaa;">></span> Enemy Codex
          </button>
          
          <button id="btn-boss" style="${btnStyle}">
             <span style="color: #ff003c;">></span> Boss Fight
          </button>
        </div>
        
        <div style="position: absolute; bottom: 20px; color: #555; font-size: 10px; font-family: monospace;">
          VER 0.9.6 // REPOMIX BUILD
        </div>
      `;

      mountEl.appendChild(root);
      ui.rootEl = root;

      // Hover effects
      const btns = root.querySelectorAll('button');
      btns.forEach((b) => {
        b.onmouseenter = () => {
          b.style.borderColor = '#fff';
          b.style.background = '#222';
          b.style.transform = 'scale(1.05)';
        };
        b.onmouseleave = () => {
          b.style.borderColor = '#445';
          b.style.background = 'rgba(0,0,0,0.6)';
          b.style.transform = 'scale(1.0)';
        };
        b.onmousedown = () => {
          b.style.background = '#fff';
          b.style.color = '#000';
        };
        b.onmouseup = () => {
          b.style.background = '#222';
          b.style.color = '#fff';
        };
      });

      // Bind Clicks
      root.querySelector('#btn-sandbox').onclick = () => {
        if (g.events) g.events.emit('scene.set', 'sandbox');
      };
      root.querySelector('#btn-codex').onclick = () => {
        if (g.events) g.events.emit('scene.set', 'codex');
      };
      root.querySelector('#btn-boss').onclick = () => {
        if (g.events) g.events.emit('scene.set', 'boss');
      };
    },

    show() {
      if (ui.rootEl) ui.rootEl.style.display = 'flex';
    },

    hide() {
      if (ui.rootEl) ui.rootEl.style.display = 'none';
    },
  };

  return ui;
}
