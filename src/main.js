// src/main.js
import './styles.css';

import { createEngine } from './core/engine.js';
import { createMainMenuScene } from './scenes/main_menu.js';
import { createSandboxScene } from './scenes/sandbox.js';
import { createCodexScene } from './scenes/codex.js';
import { createBossFightScene } from './scenes/bossfight.js';
import { createRootScene } from './scenes/root.js';

const app = document.querySelector('#app');

// Instantiate Scenes
const menuScene = createMainMenuScene();
const sandboxScene = createSandboxScene();
const codexScene = createCodexScene();
const bossScene = createBossFightScene();

// Inject into Root Controller
const rootScene = createRootScene({
  menuScene,
  sandboxScene,
  codexScene,
  bossScene,
});

const engine = createEngine({
  mountEl: app,
  scene: rootScene,
});

engine.start();
