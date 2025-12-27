// src/scenes/main_menu.js
import { createMainMenuUI } from '../ui/main_menu_ui.js';
import { drawCodexBG } from '../codex/entries.js';

export function createMainMenuScene() {
  let ui;

  return {
    init(g) {
      ui = createMainMenuUI();
      ui.mount(g);
    },

    show(g) {
      ui.show();
    },

    hide(g) {
      ui.hide();
    },

    update(g) {
      // Just background animation logic if needed
    },

    render(g) {
      // Reuse the nice grid background from the Codex
      drawCodexBG(g);
    },
  };
}
