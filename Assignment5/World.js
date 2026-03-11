import * as THREE from 'three';
import { ThreeCube } from './ThreeCube.js';
import { ThreeSphere } from './ThreeSphere.js';
import { ThreeCylinder } from './ThreeCylinder.js';
import { ThreeCone } from './ThreeCone.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';

let canvas, gl;

let g_startTime = performance.now();
let g_seconds = 0;

let g_lastTime = performance.now();
let g_frameCount = 0;
let g_fps = 0;

let g_lightPos = [0.0, 3.0, -2.0];
let g_lightAngle = 0;

let g_lightColor = [1.0, 1.0, 1.0];

let g_spotDir = [0.0, -1.0, 0.0];
let g_spotStr = 3.0;
let g_useOrbitLight = true;

let threeScene, threeCamera, threeRenderer, controls;

function setupWebGL() {
  canvas = document.getElementById('webgl');

  gl = canvas.getContext('webgl2', { preserveDrawingBuffer: true });
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL2');
    return;
  }

  gl.enable(gl.DEPTH_TEST);
}

function main() {
  setupWebGL();

  threeRenderer = new THREE.WebGLRenderer({ canvas: canvas, context: gl, antialias: true });
  threeRenderer.setSize(canvas.width, canvas.height, false);

  threeScene = new THREE.Scene();

  const cubeTextureLoader = new THREE.CubeTextureLoader().setPath('img/');
  const skyboxTexture = cubeTextureLoader.load([
    'px.png',
    'nx.png',
    'py.png',
    'ny.png',
    'pz.png',
    'nz.png',
  ]);
  threeScene.background = skyboxTexture;

  threeCamera = new THREE.PerspectiveCamera(60, canvas.width / canvas.height, 0.1, 1000);
  threeCamera.position.set(0, 3, 8);
  threeCamera.lookAt(0, 1, 0);

  controls = new OrbitControls(threeCamera, canvas);
  controls.target.set(0, 1, 0);
  controls.enableDamping = true;
  controls.dampingFactor = 0.1;
  controls.update();

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
  threeScene.add(ambientLight);
  const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
  dirLight.position.set(5, 10, 7);
  threeScene.add(dirLight);

  const spotLight = new THREE.SpotLight(0xffddaa, 50.0, 30, Math.PI / 6, 0.3, 1.0);
  spotLight.position.set(3, 8, 3);
  spotLight.target.position.set(0, 0.3, 0);
  threeScene.add(spotLight);
  threeScene.add(spotLight.target);

  const ground = new ThreeCube(threeScene);
  ground.setColor(0, 0.5, 0, 1.0);
  ground.setPosition(0, -0.01, 0);
  ground.setScale(1000, 0.5, 1000);
  ground.setTexture('img/grass.jpg', 12, 12);

  spawnRandomShapes(threeScene, 30);

  const objLoader = new OBJLoader();
  objLoader.load(
    'obj/shoe.obj',
    (obj) => {
      const texture = new THREE.TextureLoader().load('img/leather.jpg');

      obj.traverse((child) => {
        if (child.isMesh) {
          child.material = new THREE.MeshStandardMaterial({
            map: texture,
            color: new THREE.Color(0.8, 0.4, 0.4),
          });
        }
      });

      obj.position.set(0, 0.5, 0);
      obj.scale.set(0.005, 0.005, 0.005);
      threeScene.add(obj);
    },
    undefined,
    (error) => {
      console.error('Error loading obj/shoe.obj', error);
    }
  );

  initMap();

  window.addEventListener('keydown', function(ev) {
    const k = (ev.key || '').toLowerCase();
    const moveStep = 0.3;
    const dir = new THREE.Vector3();
    const right = new THREE.Vector3();

    if (!threeCamera || !controls) return;

    if (k === 'w') {
      ev.preventDefault();
      threeCamera.getWorldDirection(dir);
      dir.y = 0;
      dir.normalize();
      threeCamera.position.addScaledVector(dir, moveStep);
      controls.target.addScaledVector(dir, moveStep);
    } else if (k === 's') {
      ev.preventDefault();
      threeCamera.getWorldDirection(dir);
      dir.y = 0;
      dir.normalize();
      threeCamera.position.addScaledVector(dir, -moveStep);
      controls.target.addScaledVector(dir, -moveStep);
    } else if (k === 'a') {
      ev.preventDefault();
      threeCamera.getWorldDirection(dir);
      dir.y = 0;
      dir.normalize();
      right.crossVectors(dir, threeCamera.up).normalize();
      threeCamera.position.addScaledVector(right, -moveStep);
      controls.target.addScaledVector(right, -moveStep);
    } else if (k === 'd') {
      ev.preventDefault();
      threeCamera.getWorldDirection(dir);
      dir.y = 0;
      dir.normalize();
      right.crossVectors(dir, threeCamera.up).normalize();
      threeCamera.position.addScaledVector(right, moveStep);
      controls.target.addScaledVector(right, moveStep);
    } else if (k === 'f') { ev.preventDefault(); addBlock(); }
    else if (k === 'g') {ev.preventDefault(); removeBlock();}
    else if (k === 'l') {ev.preventDefault(); placeSpotlight();}
    renderScene();
  });

  // Specify the color for clearing <canvas>
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT);

  renderScene();
  tick();
}

function click(ev) {
  [x, y] = convertCoordinatesEventToGL(ev);

  renderScene();
}

function getCell() {
  if (!threeCamera) return null;

  const f = new THREE.Vector3();
  threeCamera.getWorldDirection(f);
  f.y = 0;
  f.normalize();

  const maxDist = 5.0;
  const stepSize = 0.5;
  let lastCellx = null;
  let lastCellz = null;

  for (let t = 1.0; t <= maxDist; t += stepSize) {
    const worldx = threeCamera.position.x + f.x * t;
    const worldz = threeCamera.position.z + f.z * t;

    const cellx = Math.floor(worldx + n / 2);
    const cellz = Math.floor(worldz + n / 2);

    if (cellx === lastCellx && cellz === lastCellz) continue;
    lastCellx = cellx;
    lastCellz = cellz;

    if (cellx < 0 || cellx >= n || cellz < 0 || cellz >= n) break;
    if (map[cellx][cellz] > 0) return { x: cellx, z: cellz };
  }

  return null;
}

function placeSpotlight() {
  const cell = getCell();
  if (!cell) return;

  const {x, z} = cell;
  g_lightPos[0] = x - n / 2 + 0.5;
  g_lightPos[1] = 3.0;
  g_lightPos[2] = z - n / 2 + 0.5;

  g_spotDir = [0.0, -1.0, 0.0];
  g_useOrbitLight = false;
}

function addBlock() {
  const cell = getCell();
  if (!cell) return;

  const {x, z} = cell;
  if (map[x][z] < 20) {
    map[x][z]++;
    walls = [];
  }
}

function removeBlock() {
  const cell = getCell();
  if (!cell) return;

  const {x, z} = cell;
  if (map[x][z] > 0) {
    map[x][z]--;
    walls = [];
  }
}

function convertCoordinatesEventToGL(ev) {
  var x = ev.clientX;
  var y = ev.clientY;
  var rect = ev.target.getBoundingClientRect();

  x = ((x - rect.left) - canvas.width / 2) / (canvas.width / 2);
  y = (canvas.height / 2 - (y - rect.top)) / (canvas.height / 2);

  return ([x, y]);
}

function clearCanvas() {
  renderScene();
  var img = document.getElementById('reference');
  if (img) img.style.display = 'none';
}
let worldSize = 32;
const n = 32;
let walls = [];
let map = [];

function initMap() {
  const baseMap = [
    [0, 1, 0, 1],
    [1, 0, 0, 0],
    [0, 0, 0, 1],
    [0, 0, 1, 0]
  ];

  map = [];
  for (let x = 0; x < n; x++) {
    map[x] = [];
    for (let z = 0; z < n; z++) {
      map[x][z] = baseMap[x % 4][z % 4];
    }
  }
}

function spawnRandomShapes(scene, count) {
  const types = ['cube', 'sphere', 'cylinder', 'cone'];

  for (let i = 0; i < count; i++) {
    const type = types[Math.floor(Math.random() * types.length)];

    const x = THREE.MathUtils.randFloat(-1000, 1000);
    const y = THREE.MathUtils.randFloat(1, 3);
    const z = THREE.MathUtils.randFloat(-1000, 1000);

    let shape;
    if (type === 'cube') {
      shape = new ThreeCube(scene);
    } else if (type === 'sphere') {
      shape = new ThreeSphere(scene);
    } else if (type === 'cylinder') {
      shape = new ThreeCylinder(scene, 0.5, 0.5, 1.5);
    } else {
      shape = new ThreeCone(scene, 0.6, 1.5);
    }

    const scale = THREE.MathUtils.randFloat(0.5, 1.5);
    shape.setScale(scale, scale, scale);

    const r = THREE.MathUtils.randFloat(0.2, 1.0);
    const g = THREE.MathUtils.randFloat(0.2, 1.0);
    const b = THREE.MathUtils.randFloat(0.2, 1.0);
    shape.setColor(r, g, b, 1.0);

    shape.setPosition(x, y, z);
  }
}

function renderScene() {
  if (!gl) return;
  if (controls) controls.update();

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  if (threeRenderer && threeScene && threeCamera) {
    threeRenderer.render(threeScene, threeCamera);
  }
}

function tick() {
  g_seconds = (performance.now() - g_startTime) / 1000.0;

  updateLight();

  updateFPS();
  renderScene();
  requestAnimationFrame(tick);
}

function updateLight() {
  if (!g_useOrbitLight) return;

  var radius = 8.0;
  var rad = g_lightAngle * Math.PI / 180.0;

  g_lightPos[0] = radius * Math.cos(rad);
  g_lightPos[2] = radius * Math.sin(rad);
  g_lightPos[1] = 3.0;
}

function updateFPS() {
  g_frameCount++;
  let now = performance.now();
  let delta = now - g_lastTime;

  if (delta >= 1000) {
    g_fps = Math.round((g_frameCount * 1000) / delta);
    document.getElementById("fps").innerText = `FPS: ${g_fps}`;
    g_frameCount = 0;
    g_lastTime = now;
  }
}

main();
