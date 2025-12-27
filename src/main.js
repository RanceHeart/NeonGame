import './styles.css';

import { createEngine } from './core/engine.js';
import { createSandboxScene } from './scenes/sandbox.js';
// import { createBossFightScene } from './scenes/bossfight.js';

const app = document.querySelector('#app');

const engine = createEngine({
  mountEl: app,
  // 这里切场景：先 sandbox，后面你再换 bossfight
  scene: createSandboxScene(),
  // scene: createBossFightScene(),
});

engine.start();
