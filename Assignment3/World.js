// ColoredPoint.js (c) 2012 matsuda
// Vertex shader program
var VSHADER_SOURCE =`
  precision mediump float;
  attribute vec4 a_Position;
  attribute vec2 a_UV;  
  varying vec2 v_UV;
  uniform mat4 u_ModelMatrix;
  uniform mat4 u_GlobalRotation;
  uniform mat4 u_ViewMatrix;
  uniform mat4 u_ProjectionMatrix;
  void main() {
  gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_GlobalRotation * u_ModelMatrix * a_Position;
  v_UV = a_UV;
  }`;

// Fragment shader program
var FSHADER_SOURCE =`
  precision mediump float;
  varying vec2 v_UV;
  uniform vec4 u_FragColor;
  uniform sampler2D u_Sampler0;
  uniform sampler2D u_Sampler1;
  uniform int u_useTexture;
  uniform float u_texColorWeight;
  void main() {
    if (u_useTexture == 0) {
      gl_FragColor = u_FragColor;
    } else if (u_useTexture == 1) {
      gl_FragColor = vec4(v_UV, 1.0, 1.0);
    } else if (u_useTexture == 2) {
      vec4 texColor = texture2D(u_Sampler0, v_UV);
      gl_FragColor = mix(u_FragColor, texColor, u_texColorWeight);
    } else if (u_useTexture == 3) {
      vec4 texColor = texture2D(u_Sampler1, v_UV);
      gl_FragColor = mix(u_FragColor, texColor, u_texColorWeight);
    } else {
      gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
    }
  }`;

let canvas, gl, a_Position, a_UV, u_FragColor, u_ModelMatrix, u_GlobalRotation, u_ViewMatrix, u_ProjectionMatrix,
    u_useTexture, u_Sampler0, u_texColorWeight, u_Sampler1, camera;
let g_GlobalRotation = 0.0;
let g_legRotate1 = 0.0;
let g_legRotate2 = 0.0;
let g_kneeFrontRotate = 0.0;
let g_kneeBackRotate = 0.0;
let g_ankleRotate1 = 0.0;
let g_ankleRotate2 = 0.0;
let g_headRotate = 0.0;
let g_tailRotate = 0.0;
let g_bodyTilt = 0.0;

let g_startTime = performance.now();
let g_seconds = 0;
let g_animate = false;

let g_globalAngleX = 0;
let g_globalAngleY = 0;

let g_lastMouseX = null;

let g_preExplode = null;
let g_isExploding = false;
let g_explodeStartTime = 0;

let g_lastTime = performance.now();
let g_frameCount = 0;
let g_fps = 0;

function setupWebGL() {
  // Retrieve <canvas> element
  canvas = document.getElementById('webgl');

  // Get the rendering context for WebGL
  gl = canvas.getContext("webgl", {preserveDrawingBuffer: true});
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }

  gl.enable(gl.DEPTH_TEST);
}

function connectVariablesToGLSL() {
    // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }

  // // Get the storage location of a_Position
  a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return;
  }

  a_UV = gl.getAttribLocation(gl.program, 'a_UV');
  if (a_UV < 0) {
    console.log('Failed to get the storage location of a_UV');
    return;
  }

  // Get the storage location of u_FragColor
  u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
  if (!u_FragColor) {
    console.log('Failed to get the storage location of u_FragColor');
    return;
  }

  u_useTexture = gl.getUniformLocation(gl.program, 'u_useTexture');
  if (!u_useTexture) {
    console.log('Failed to get the storage location of u_useTexture');
    return;
  }

  u_Sampler0 = gl.getUniformLocation(gl.program, 'u_Sampler0');
  if (!u_Sampler0) {
    console.log('Failed to get the storage location of u_Sampler0');
    return false;
  }

  u_Sampler1 = gl.getUniformLocation(gl.program, 'u_Sampler1');
  if (!u_Sampler1) {
    console.log('Failed to get the storage location of u_Sampler1');
    return false;
  }

  u_texColorWeight = gl.getUniformLocation(gl.program, 'u_texColorWeight');
  if (u_texColorWeight === null) {
    console.log('Failed to get the storage location of u_texColorWeight');
    return false;
  }

  u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  if (!u_ModelMatrix) {
    console.log('Failed to get the storage location of u_ModelMatrix');
    return;
  }

  u_GlobalRotation = gl.getUniformLocation(gl.program, 'u_GlobalRotation');
  if (!u_GlobalRotation) {
    console.log('Failed to get the storage location of u_GlobalRotation');
    return;
  }

  u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
  if (!u_ViewMatrix) {
    console.log('Failed to get the storage location of u_ViewMatrix');
    return;
  }

  u_ProjectionMatrix = gl.getUniformLocation(gl.program, 'u_ProjectionMatrix');
  if (!u_ProjectionMatrix) {
    console.log('Failed to get the storage location of u_ProjectionMatrix');
    return;
  }

  var identityM = new Matrix4();
  gl.uniformMatrix4fv(u_ModelMatrix, false, identityM.elements);

  gl.uniformMatrix4fv(u_ViewMatrix, false, camera.viewMatrix.elements);
  gl.uniformMatrix4fv(u_ProjectionMatrix, false, camera.projectionMatrix.elements);
}

function addUiEvents() {
  document.getElementById('rotate').addEventListener('mousemove', function() {
    g_GlobalRotation = this.value;
    renderScene();
  });

  document.getElementById('leg1').addEventListener('mousemove', function() {
    g_legRotate1 = this.value;
    renderScene();
  });

  document.getElementById('leg2').addEventListener('mousemove', function() {
    g_legRotate2 = this.value;
    renderScene();
  });

  document.getElementById('kneeFront').addEventListener('mousemove', function() {
    g_kneeFrontRotate = this.value;
    renderScene();
  });

  document.getElementById('kneeBack').addEventListener('mousemove', function() {
    g_kneeBackRotate = this.value;
    renderScene();
  });

  document.getElementById('ankleFront').addEventListener('mousemove', function() {
    g_ankleRotate1 = this.value;
    renderScene();
  });

  document.getElementById('ankleBack').addEventListener('mousemove', function() {
    g_ankleRotate2 = this.value;
    renderScene();
  });
}

function main() {
  setupWebGL();

  camera = new Camera(canvas);

  initMap();

  randomizeAnimalPosition();

  connectVariablesToGLSL();

  addUiEvents();

  initTextures();

  canvas.addEventListener('mousemove', onMouseMove);

  // canvas.onclick = function(ev) {
  //   if (ev.shiftKey) {
  //     g_preExplode = {
  //       headRotate: g_headRotate,
  //       bodyTilt: g_bodyTilt,
  //       legRotate1: g_legRotate1,
  //       legRotate2: g_legRotate2,
  //       kneeFront: g_kneeFrontRotate,
  //       kneeBack: g_kneeBackRotate,
  //       tailRotate: g_tailRotate
  //     };
  //     g_isExploding = true;
  //     g_explodeStartTime = performance.now();
  //   }
  // };

  window.addEventListener('keydown', function(ev) {
    const k = (ev.key || '').toLowerCase();
    if (k === 'w') { ev.preventDefault(); camera.moveForward(); }
    else if (k === 's') {ev.preventDefault(); camera.moveBackwards();}
    else if (k === 'a') {ev.preventDefault(); camera.moveLeft();}
    else if (k === 'd') {ev.preventDefault(); camera.moveRight();}
    else if (k === 'q') {ev.preventDefault(); camera.panLeft();}
    else if (k === 'e') {ev.preventDefault(); camera.panRight();}
    else if (k === 'f') {ev.preventDefault(); addBlock();}
    else if (k === 'g') {ev.preventDefault(); removeBlock();}
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
  if (!camera) return null;

  let f = new Vector3();
  f.set(camera.at);
  f.sub(camera.eye);
  f.normalize();

  const step = 1.5;
  const targetX = camera.eye.elements[0] + f.elements[0] * step;
  const targetZ = camera.eye.elements[2] + f.elements[2] * step;

  const ix = Math.floor(targetX + n / 2);
  const iz = Math.floor(targetZ + n / 2);

  if (ix < 0 || ix >= n || iz < 0 || iz >= n) return null;
  return { x: ix, z: iz };
}

function getCell() {
  if (!camera) return null;

  let f = new Vector3();
  f.set(camera.at);
  f.sub(camera.eye);
  f.normalize();

  const maxDist = 5.0;
  const stepSize = 0.5;
  let lastIx = null;
  let lastIz = null;

  for (let t = 1.0; t <= maxDist; t += stepSize) {
    const tx = camera.eye.elements[0] + f.elements[0] * t;
    const tz = camera.eye.elements[2] + f.elements[2] * t;

    const ix = Math.floor(tx + n / 2);
    const iz = Math.floor(tz + n / 2);

    if (ix === lastIx && iz === lastIz) continue;
    lastIx = ix;
    lastIz = iz;

    if (ix < 0 || ix >= n || iz < 0 || iz >= n) break;
    if (map[ix][iz] > 0) return { x: ix, z: iz };
  }

  return null;
}

function addBlock() {
  const cell = getCell();
  if (!cell) return;

  const { x, z } = cell;
  if (map[x][z] < 20) {
    map[x][z]++;
    walls = [];
  }
}

function removeBlock() {
  const cell = getCell();
  if (!cell) return;

  const { x, z } = cell;
  if (map[x][z] > 0) {
    map[x][z]--;
    walls = [];
  }
}

function onMouseMove(ev) {
  if (ev.buttons !== 1) {
    g_lastMouseX = null;
    return;
  }

  if (g_lastMouseX === null) {
    g_lastMouseX = ev.clientX;
    return;
  }

  const dx = ev.clientX - g_lastMouseX;
  g_lastMouseX = ev.clientX;

  const sensitivity = 0.2;
  const angle = dx * sensitivity;

  if (angle > 0) {
    camera.panRight(angle);
  } else if (angle < 0) {
    camera.panLeft(-angle);
  }

  renderScene();
}

function convertCoordinatesEventToGL(ev) {
  var x = ev.clientX;
  var y = ev.clientY;
  var rect = ev.target.getBoundingClientRect();

  x = ((x - rect.left) - canvas.width/2)/(canvas.width/2);
  y = (canvas.height/2 - (y - rect.top))/(canvas.height/2);

  return ([x, y]);
}

function initVertexBuffers(gl) {
  var verticesTexCoords = new Float32Array([
    -0.5,  0.5,   0.0, 1.0,
    -0.5, -0.5,   0.0, 0.0,
     0.5,  0.5,   1.0, 1.0,
     0.5, -0.5,   1.0, 0.0,
  ]);

  var n = 4;

  var vertexTexCoordBuffer = gl.createBuffer();
  if (!vertexTexCoordBuffer) {
    console.log('Failed to create the buffer object');
    return -1;
  }

  gl.bindBuffer(gl.ARRAY_BUFFER, vertexTexCoordBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, verticesTexCoords, gl.STATIC_DRAW);

  var FSIZE = verticesTexCoords.BYTES_PER_ELEMENT;
  gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, FSIZE * 4, 0);
  gl.enableVertexAttribArray(a_Position);

  gl.vertexAttribPointer(a_UV, 2, gl.FLOAT, false, FSIZE * 4, FSIZE * 2);
  gl.enableVertexAttribArray(a_UV);

  return n;
}

function initTextures() {
  var image0 = new Image();
  image0.onload = function(){uploadTexture(image0, 0);};
  image0.src = 'img/grass.jpg';

  var image1 = new Image();
  image1.onload = function(){uploadTexture(image1, 1);};
  image1.src = 'img/sky.png';

  return true;
}
function uploadTexture(image, unit) {
  var texture = gl.createTexture();
  if (!texture) {
    console.log('Failed to create the texture object');
    return false;
  }

  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);

  gl.activeTexture(gl.TEXTURE0 + unit);
  gl.bindTexture(gl.TEXTURE_2D, texture);

  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);

  if (unit === 0) {
    gl.uniform1i(u_Sampler0, 0);
  } else if (unit === 1) {
    gl.uniform1i(u_Sampler1, 1);
  }

  return true;
}

function clearCanvas() {
  g_shapesList = [];
  renderScene();
  var img = document.getElementById('reference');
  if (img) img.style.display = 'none';
}

const fur = [0.545, 0.271, 0.075, 1.0];
const horn = [0.9, 0.9, 0.9, 1.0];
const hoof = [0.2, 0.2, 0.2, 1.0];
const eyes = [0.0, 0.0, 0.0, 1.0];
const nose = [0.0, 0.0, 0.0, 1.0];

// I was having trouble managing my animal's position now with the added world features,
// as well as the sizing, so I had Copilot help by generating some variables to manage these things.

const animalOffsetY = 0.5;
const animalScaleY = 0.5;
const animalScaleXZ = 0.5;

let animalPosX = 0;
let animalPosZ = 0;
let hasFoundOx = false;

const explodeData = {
  body:  {dir: [0, 1, 0], spin: 30},
  head:  {dir: [0, 1, 1], spin: 60},

  upperlegFL: {dir: [-1, -1, 1], spin: 80},
  upperlegFR: {dir: [1, -1, 1], spin: 80},
  upperlegBL: {dir: [-1, -1, -1], spin: 80},
  upperlegBR: {dir: [1, -1, -1], spin: 80},

  lowerlegFL: {dir: [-1, -1, 1], spin: 80},
  lowerlegFR: {dir: [1, -1, 1], spin: 80},
  lowerlegBL: {dir: [-1, -1, -1], spin: 80},
  lowerlegBR: {dir: [1, -1, -1], spin: 80},

  tail:  {dir: [0, -1, -1], spin: 100},
  hornL: {dir: [-1, 1, 1], spin: 120},
  hornR: {dir: [1, 1, 1], spin: 120},
  eyeL:  {dir: [-0.5, 1, 1], spin: 160},
  eyeR:  {dir: [0.5, 1, 1], spin: 160},
  nose:  {dir: [0, 1, 1], spin: 160},
  hoofFL: {dir: [-1, -1, 1], spin: 140},
  hoofFR: {dir: [1, -1, 1], spin: 140},
  hoofBL: {dir: [-1, -1, -1], spin: 140},
  hoofBR: {dir: [1, -1, -1], spin: 140}
};

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

function randomizeAnimalPosition() {
  while (true) {
    const gx = Math.floor(Math.random() * n);
    const gz = Math.floor(Math.random() * n);
    if (map[gx][gz] === 0) {
      animalPosX = gx - n / 2 + 0.5;
      animalPosZ = gz - n / 2 + 0.5;
      break;
    }
  }
}

function renderScene() {
  let globalRotMat = new Matrix4();
  globalRotMat.rotate(g_globalAngleX, 1, 0, 0);
  globalRotMat.rotate(g_globalAngleY, 0, 1, 0);
  globalRotMat.rotate(g_GlobalRotation, 0, 1, 0);
  gl.uniformMatrix4fv(u_GlobalRotation, false, globalRotMat.elements);

  if (typeof camera !== 'undefined' && camera && camera.viewMatrix && camera.projectionMatrix) {
    gl.uniformMatrix4fv(u_ViewMatrix, false, camera.viewMatrix.elements);
    gl.uniformMatrix4fv(u_ProjectionMatrix, false, camera.projectionMatrix.elements);
  }

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  let explodeT = 0;
  if (g_isExploding) {
    explodeT = Math.min((performance.now() - g_explodeStartTime) / 1000, 1);
  }

  const ground = new Cube();
  ground.color = [0, 0.5, 0, 1.0];
  ground.textureNum = 2;
  ground.texWeight = 0.5;
  ground.matrix.setTranslate(-n/2, -0.01, -n/2);
  ground.matrix.scale(n, 0.02, n);
  ground.render();

  const sky = new Cube();
  sky.color = [0.5, 0.7, 1.0, 1.0];
  sky.textureNum = 3;
  sky.texWeight = 1.0;
  sky.matrix.setTranslate(-500, -500, -500);
  sky.matrix.scale(1000, 1000, 1000);
  sky.render();

  if (!walls || walls.length === 0) {
    walls = [];
    for (let x = 0; x < n; x++) {
      for (let z = 0; z < n; z++) {
        const height = map[x][z];
        for (let y = 0; y < height; y++) {
          const w = new Cube();
          w.color = [0.6, 0.4, 0.2, 1.0];
          w.textureNum = 2;
          w.texWeight = 0.5;
          w.matrix.setTranslate(x - n/2 + 0.5, y, z - n/2 + 0.5);
          walls.push(w);
        }
      }
    }
  }

  for (let k = 0; k < walls.length; k++) {
    walls[k].renderFast();
  }

  let animalRoot = new Matrix4();
  animalRoot.setTranslate(animalPosX, animalOffsetY, animalPosZ);
  animalRoot.scale(animalScaleXZ, animalScaleY, animalScaleXZ);

  var body = new Cube();
  body.color = fur;
  body.matrix.set(animalRoot);
  body.matrix.translate(-0.5, -0.5, 0.0);
  if (g_bodyTilt) {
    body.matrix.rotate(g_bodyTilt, 1, 0, 0);
  }
  body.matrix.scale(1, 0.5, 1);
  if (g_isExploding) {
    let d = explodeData.body.dir;
    body.matrix.translate(
      d[0] * explodeT * 2,
      d[1] * explodeT * 2,
      d[2] * explodeT * 2
    );
    body.matrix.rotate(explodeData.body.spin * explodeT, 1, 1, 1);
  }
  body.render();

  var head = new Cube();
  head.color = fur;
  head.matrix.set(animalRoot);
  head.matrix.translate(-0.3, -0.20, 0.55);
  head.matrix.translate(0.5, 0.5, 0.0);
  head.matrix.rotate(g_headRotate, 0, 1, 0);
  head.matrix.translate(-0.5, -0.5, 0.0);
  head.matrix.scale(0.6, 0.45, 0.45);
  if (g_isExploding) {
    let d = explodeData.head.dir;
    head.matrix.translate(
      d[0] * explodeT * 2,
      d[1] * explodeT * 2,
      d[2] * explodeT * 2
    );
    head.matrix.rotate(explodeData.head.spin * explodeT, 1, 1, 1);
  }
  var headMat = new Matrix4(head.matrix);
  head.render();

  var eyeL = new Cube();
  eyeL.color = eyes;
  eyeL.matrix = new Matrix4(headMat);
  eyeL.matrix.translate(0.25, 0.65, 1.02);
  eyeL.matrix.scale(0.06, 0.06, 0.02);
  if (g_isExploding) {
    let d = explodeData.eyeL.dir;
    eyeL.matrix.translate(
      d[0] * explodeT * 2,
      d[1] * explodeT * 2,
      d[2] * explodeT * 2
    );
    eyeL.matrix.rotate(explodeData.eyeL.spin * explodeT, 1, 1, 1);
  }
  eyeL.render();

  var eyeR = new Cube();
  eyeR.color = eyes;
  eyeR.matrix = new Matrix4(headMat);
  eyeR.matrix.translate(0.55, 0.65, 1.02);
  eyeR.matrix.scale(0.06, 0.06, 0.02);
  if (g_isExploding) {
    let d = explodeData.eyeR.dir;
    eyeR.matrix.translate(
      d[0] * explodeT * 2,
      d[1] * explodeT * 2,
      d[2] * explodeT * 2
    );
    eyeR.matrix.rotate(explodeData.eyeR.spin * explodeT, 1, 1, 1);
  }
  eyeR.render();

  var nose = new Cube();
  nose.color = eyes;
  nose.matrix = new Matrix4(headMat);
  nose.matrix.translate(0.40, 0.45, 1.04);
  nose.matrix.scale(0.14, 0.08, 0.04);
  if (g_isExploding) {
    let d = explodeData.nose.dir;
    nose.matrix.translate(
      d[0] * explodeT * 2,
      d[1] * explodeT * 2,
      d[2] * explodeT * 2
    );
    nose.matrix.rotate(explodeData.nose.spin * explodeT, 1, 1, 1);
  }
  nose.render();

  var upperlegFL = new Cube();
  upperlegFL.color = fur;
  upperlegFL.matrix.set(animalRoot);
  upperlegFL.matrix.translate(-0.45, -0.25, 0.65);
  upperlegFL.matrix.rotate(g_legRotate1, 1, 0, 0);
  var upperlegFLMat = new Matrix4(upperlegFL.matrix);
  upperlegFL.matrix.translate(0, -0.45, 0);
  upperlegFL.matrix.scale(0.2, 0.2, 0.2);
  if (g_isExploding) {
    let d = explodeData.upperlegFL.dir;
    upperlegFL.matrix.translate(
      d[0] * explodeT * 2,
      d[1] * explodeT * 2,
      d[2] * explodeT * 2
    );
    upperlegFL.matrix.rotate(explodeData.upperlegFL.spin * explodeT, 1, 1, 1);
  }
  upperlegFL.render();

  var lowerlegFL = new Cube();
  lowerlegFL.color = fur;
  lowerlegFL.matrix = upperlegFLMat;
  lowerlegFL.matrix.translate(0, -0.45, 0);
  lowerlegFL.matrix.rotate(g_kneeFrontRotate, -1, 0, 0);
  var lowerlegFLMat = new Matrix4(lowerlegFL.matrix);
  lowerlegFL.matrix.translate(0, -0.20, 0);
  lowerlegFL.matrix.scale(0.2, 0.2, 0.2);
  if (g_isExploding) {
    let d = explodeData.lowerlegFL.dir;
    lowerlegFL.matrix.translate(
      d[0] * explodeT * 2,
      d[1] * explodeT * 2,
      d[2] * explodeT * 2
    );
    lowerlegFL.matrix.rotate(explodeData.lowerlegFL.spin * explodeT, 1, 1, 1);
  }
  lowerlegFL.render();

  var hoofFL = new Cube();
  hoofFL.color =  hoof;
  hoofFL.matrix = lowerlegFLMat;
  hoofFL.matrix.rotate(g_ankleRotate1, 1, 0, 0);
  hoofFL.matrix.translate(0, -0.25, 0);
  hoofFL.matrix.scale(0.22, 0.099, 0.22);
  if (g_isExploding) {
    let d = explodeData.hoofFL.dir;
    hoofFL.matrix.translate(
      d[0] * explodeT * 2,
      d[1] * explodeT * 2,
      d[2] * explodeT * 2
    );
    hoofFL.matrix.rotate(explodeData.hoofFL.spin * explodeT, 1, 1, 1);
  }
  gl.enable(gl.POLYGON_OFFSET_FILL);
  gl.polygonOffset(1.0, 1.0);
  hoofFL.render();
  gl.disable(gl.POLYGON_OFFSET_FILL);

  var upperlegBL = new Cube();
  upperlegBL.color = fur;
  upperlegBL.matrix.set(animalRoot);
  upperlegBL.matrix.translate(-0.45, -0.25, 0.15);
  upperlegBL.matrix.rotate(g_legRotate2, 1, 0, 0);
  var upperlegBLMat = new Matrix4(upperlegBL.matrix);
  upperlegBL.matrix.translate(0, -0.45, 0);
  upperlegBL.matrix.scale(0.2, 0.2, 0.2);
  if (g_isExploding) {
    let d = explodeData.upperlegBL.dir;
    upperlegBL.matrix.translate(
      d[0] * explodeT * 2,
      d[1] * explodeT * 2,
      d[2] * explodeT * 2
    );
    upperlegBL.matrix.rotate(explodeData.upperlegBL.spin * explodeT, 1, 1, 1);
  }
  upperlegBL.render();

  var lowerlegBL = new Cube();
  lowerlegBL.color = fur;
  lowerlegBL.matrix = upperlegBLMat;
  lowerlegBL.matrix.translate(0, -0.45, 0);
  lowerlegBL.matrix.rotate(g_kneeBackRotate, 1, 0, 0);
  var lowerlegBLMat = new Matrix4(lowerlegBL.matrix);
  lowerlegBL.matrix.translate(0, -0.25, 0);
  lowerlegBL.matrix.scale(0.2, 0.3, 0.2);
  if (g_isExploding) {
    let d = explodeData.lowerlegBL.dir;
    lowerlegBL.matrix.translate(
      d[0] * explodeT * 2,
      d[1] * explodeT * 2,
      d[2] * explodeT * 2
    );
    lowerlegBL.matrix.rotate(explodeData.lowerlegBL.spin * explodeT, 1, 1, 1);
  }
  lowerlegBL.render();

  var hoofBL = new Cube();
  hoofBL.color = hoof;
  hoofBL.matrix = lowerlegBLMat;
  hoofBL.matrix.rotate(g_ankleRotate2, 1, 0, 0);
  hoofBL.matrix.translate(0, -0.25, 0);
  hoofBL.matrix.scale(0.22, 0.099, 0.22);
  if (g_isExploding) {
    let d = explodeData.hoofBL.dir;
    hoofBL.matrix.translate(
      d[0] * explodeT * 2,
      d[1] * explodeT * 2,
      d[2] * explodeT * 2
    );
    hoofBL.matrix.rotate(explodeData.hoofBL.spin * explodeT, 1, 1, 1);
  }
  gl.enable(gl.POLYGON_OFFSET_FILL);
  gl.polygonOffset(1.0, 1.0);
  hoofBL.render();
  gl.disable(gl.POLYGON_OFFSET_FILL);

  var upperlegFR = new Cube();
  upperlegFR.color = fur;
  upperlegFR.matrix.set(animalRoot);
  upperlegFR.matrix.translate(0.25, -0.25, 0.65);
  upperlegFR.matrix.rotate(g_legRotate2, 1, 0, 0);
  var upperlegFRMat = new Matrix4(upperlegFR.matrix);
  upperlegFR.matrix.translate(0, -0.45, 0);
  upperlegFR.matrix.scale(0.2, 0.2, 0.2);
  if (g_isExploding) {
    let d = explodeData.upperlegFR.dir;
    upperlegFR.matrix.translate(
      d[0] * explodeT * 2,
      d[1] * explodeT * 2,
      d[2] * explodeT * 2
    );
    upperlegFR.matrix.rotate(explodeData.upperlegFR.spin * explodeT, 1, 1, 1);
  }
  upperlegFR.render();

  var lowerlegFR = new Cube();
  lowerlegFR.color = fur;
  lowerlegFR.matrix = upperlegFRMat;
  lowerlegFR.matrix.translate(0, -0.45, 0);
  lowerlegFR.matrix.rotate(g_kneeFrontRotate, -1, 0, 0);
  var lowerlegFRMat = new Matrix4(lowerlegFR.matrix);
  lowerlegFR.matrix.translate(0, -0.20, 0);
  lowerlegFR.matrix.scale(0.2, 0.2, 0.2);
  if (g_isExploding) {
    let d = explodeData.lowerlegFR.dir;
    lowerlegFR.matrix.translate(
      d[0] * explodeT * 2,
      d[1] * explodeT * 2,
      d[2] * explodeT * 2
    );
    lowerlegFR.matrix.rotate(explodeData.lowerlegFR.spin * explodeT, 1, 1, 1);
  }
  lowerlegFR.render();

  var hoofFR = new Cube();
  hoofFR.color = hoof;
  hoofFR.matrix = lowerlegFRMat;
  hoofFR.matrix.rotate(g_ankleRotate1, 1, 0, 0);
  hoofFR.matrix.translate(0, -0.25, 0);
  hoofFR.matrix.scale(0.22, 0.099, 0.22);
  if (g_isExploding) {
    let d = explodeData.hoofFR.dir;
    hoofFR.matrix.translate(
      d[0] * explodeT * 2,
      d[1] * explodeT * 2,
      d[2] * explodeT * 2
    );
    hoofFR.matrix.rotate(explodeData.hoofFR.spin * explodeT, 1, 1, 1);
  }
  gl.enable(gl.POLYGON_OFFSET_FILL);
  gl.polygonOffset(1.0, 1.0);
  hoofFR.render();
  gl.disable(gl.POLYGON_OFFSET_FILL);

  var upperlegBR = new Cube();
  upperlegBR.color = fur;
  upperlegBR.matrix.set(animalRoot);
  upperlegBR.matrix.translate(0.25, -0.25, 0.15);
  upperlegBR.matrix.rotate(g_legRotate1, 1, 0, 0);
  var upperlegBRMat = new Matrix4(upperlegBR.matrix);
  upperlegBR.matrix.translate(0, -0.45, 0);
  upperlegBR.matrix.scale(0.2, 0.2, 0.2);
  if (g_isExploding) {
    let d = explodeData.upperlegBR.dir;
    upperlegBR.matrix.translate(
      d[0] * explodeT * 2,
      d[1] * explodeT * 2,
      d[2] * explodeT * 2
    );
    upperlegBR.matrix.rotate(explodeData.upperlegBR.spin * explodeT, 1, 1, 1);
  }
  upperlegBR.render();

  var lowerlegBR = new Cube();
  lowerlegBR.color = fur;
  lowerlegBR.matrix = upperlegBRMat;
  lowerlegBR.matrix.translate(0, -0.45, 0);
  lowerlegBR.matrix.rotate(g_kneeBackRotate, 1, 0, 0);
  var lowerlegBRMat = new Matrix4(lowerlegBR.matrix);
  lowerlegBR.matrix.translate(0, -0.25, 0);
  lowerlegBR.matrix.scale(0.2, 0.3, 0.2);
  if (g_isExploding) {
    let d = explodeData.lowerlegBR.dir;
    lowerlegBR.matrix.translate(
      d[0] * explodeT * 2,
      d[1] * explodeT * 2,
      d[2] * explodeT * 2
    );
    lowerlegBR.matrix.rotate(explodeData.lowerlegBR.spin * explodeT, 1, 1, 1);
  }
  lowerlegBR.render();

  var hoofBR = new Cube();
  hoofBR.color = hoof;
  hoofBR.matrix = lowerlegBRMat;
  hoofBR.matrix.rotate(g_ankleRotate2, 1, 0, 0);
  hoofBR.matrix.translate(0, -0.25, 0);
  hoofBR.matrix.scale(0.22, 0.099, 0.22);
  if (g_isExploding) {
    let d = explodeData.hoofBR.dir;
    hoofBR.matrix.translate(
      d[0] * explodeT * 2,
      d[1] * explodeT * 2,
      d[2] * explodeT * 2
    );
    hoofBR.matrix.rotate(explodeData.hoofBR.spin * explodeT, 1, 1, 1);
  }
  gl.enable(gl.POLYGON_OFFSET_FILL);
  gl.polygonOffset(1.0, 1.0);
  hoofBR.render();
  gl.disable(gl.POLYGON_OFFSET_FILL);

  // I was having trouble with the horns positioning, so I had Copilot generate the code for this.
  // For the hooves, I was also having trouble with the z-fighting, so I had Copilot generate
  // the polygon offset code.

  var hornL = new Cube();
  hornL.color = horn;
  hornL.matrix.set(headMat);
  hornL.matrix.translate(-0.2, 0.75, 0.50);
  hornL.matrix.scale(0.2, 0.12, 0.12);
  if (g_isExploding) {
    let d = explodeData.hornL.dir;
    hornL.matrix.translate(
      d[0] * explodeT * 2,
      d[1] * explodeT * 2,
      d[2] * explodeT * 2
    );
    hornL.matrix.rotate(explodeData.hornL.spin * explodeT, 1, 1, 1);
  }
  hornL.render();

  var hornR = new Cube();
  hornR.color = horn;
  hornR.matrix.set(headMat);
  hornR.matrix.translate(1.0, 0.75, 0.50);
  hornR.matrix.scale(0.2, 0.12, 0.12);
  if (g_isExploding) {
    let d = explodeData.hornR.dir;
    hornR.matrix.translate(
      d[0] * explodeT * 2,
      d[1] * explodeT * 2,
      d[2] * explodeT * 2
    );
    hornR.matrix.rotate(explodeData.hornR.spin * explodeT, 1, 1, 1);
  }
  hornR.render();

  var tail = new Cube();
  tail.color = fur;
  tail.matrix.set(animalRoot);
  tail.matrix.translate(-0.05, -0.15, -0.15);
  tail.matrix.translate(0.5, 0.5, 1.0);
  tail.matrix.rotate(g_tailRotate, 0, 1, 0);
  tail.matrix.translate(-0.5, -0.5, -1.0);
  tail.matrix.scale(0.1, 0.1, 0.4);
  if (g_isExploding) {
    let d = explodeData.tail.dir;
    tail.matrix.translate(
      d[0] * explodeT * 2,
      d[1] * explodeT * 2,
      d[2] * explodeT * 2
    );
    tail.matrix.rotate(explodeData.tail.spin * explodeT, 1, 1, 1);
  }
  tail.render();
}

function tick() {
  g_seconds = (performance.now() - g_startTime) / 1000.0;

  if (g_animate) {
    updateAnimationAngles();
  }

  if (g_isExploding) {
    let dt = (performance.now() - g_explodeStartTime) / 1000;
    if (dt > 1.0) {
        g_isExploding = false;
        if (g_preExplode) {
          g_headRotate = g_preExplode.headRotate;
          g_bodyTilt = 0.0;
          g_legRotate1 = g_preExplode.legRotate1;
          g_legRotate2 = g_preExplode.legRotate2;
          g_kneeFrontRotate = g_preExplode.kneeFront;
          g_kneeBackRotate = g_preExplode.kneeBack;
          g_tailRotate = g_preExplode.tailRotate;
          g_preExplode = null;
        } else {
          g_headRotate = 0.0;
          g_bodyTilt = 0.0;
        }
      } else {
      g_headRotate = -30 * dt;
      g_bodyTilt = 20 * dt;
      g_legRotate1 = 0;
      g_legRotate2 = 0;
    }
  }
  
  checkForOxFound();
  
  updateFPS();
  renderScene();
  requestAnimationFrame(tick);
}

function checkForOxFound() {
  if (!camera || hasFoundOx) return;

  const dx = camera.eye.elements[0] - animalPosX;
  const dz = camera.eye.elements[2] - animalPosZ;
  const dist = Math.sqrt(dx * dx + dz * dz);

  if (dist < 1.5) {
    hasFoundOx = true;
    const statusEl = document.getElementById('status');
    if (statusEl) {
      statusEl.innerText = 'You found it!';
    } else {
      alert('You found the ox!');
    }
  }
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

function updateAnimationAngles() {
  let t = performance.now() / 1000;

  g_legRotate1 = 30 * Math.sin(g_seconds * 4);
  g_legRotate2 = -30 * Math.sin(g_seconds * 4);

  g_kneeFrontRotate = 25 * (Math.sin(g_seconds * 4 + Math.PI / 2) + 1) / 2;
  g_kneeBackRotate  = 10 * (Math.sin(g_seconds * 4 - Math.PI / 2) + 1) / 2;

  g_ankleRotate1 = 5 * (Math.sin(g_seconds * 4 + Math.PI / 2) + 1) / 2;
  g_ankleRotate2 = 5 * (Math.sin(g_seconds * 4 - Math.PI / 2) + 1) / 2;

  g_tailRotate = 10 * Math.sin(t * 1.5);
  g_headRotate = 5 * Math.sin(t);
}
