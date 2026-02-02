// ColoredPoint.js (c) 2012 matsuda
// Assigned Animal: Ox
// Vertex shader program
var VSHADER_SOURCE =`
  attribute vec4 a_Position;
  uniform mat4 u_ModelMatrix;
  uniform mat4 u_GlobalRotation;
  void main() {
  gl_Position = u_GlobalRotation * u_ModelMatrix * a_Position;
  }`;

// Fragment shader program
var FSHADER_SOURCE =`
  precision mediump float;
  uniform vec4 u_FragColor;
  void main() {
    gl_FragColor = u_FragColor;
  }`;

let canvas, gl, a_Position, u_FragColor, u_ModelMatrix, u_GlobalRotation;
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

  // Get the storage location of u_FragColor
  u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
  if (!u_FragColor) {
    console.log('Failed to get the storage location of u_FragColor');
    return;
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

  var identityM = new Matrix4();
  gl.uniformMatrix4fv(u_ModelMatrix, false, identityM.elements);
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

  connectVariablesToGLSL();

  addUiEvents();

  canvas.onmousemove = function(ev) {
    if (ev.buttons === 1) {
      g_globalAngleY = ev.clientX / canvas.width * 360;
      g_globalAngleX = ev.clientY / canvas.height * 180 - 90;
    }
  };

  canvas.onclick = function(ev) {
    if (ev.shiftKey) {
      g_preExplode = {
        headRotate: g_headRotate,
        bodyTilt: g_bodyTilt,
        legRotate1: g_legRotate1,
        legRotate2: g_legRotate2,
        kneeFront: g_kneeFrontRotate,
        kneeBack: g_kneeBackRotate,
        tailRotate: g_tailRotate
      };
      g_isExploding = true;
      g_explodeStartTime = performance.now();
    }
  };

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

function convertCoordinatesEventToGL(ev) {
  var x = ev.clientX;
  var y = ev.clientY;
  var rect = ev.target.getBoundingClientRect();

  x = ((x - rect.left) - canvas.width/2)/(canvas.width/2);
  y = (canvas.height/2 - (y - rect.top))/(canvas.height/2);

  return ([x, y]);
}

const fur = [0.545, 0.271, 0.075, 1.0];
const horn = [0.9, 0.9, 0.9, 1.0];
const hoof = [0.2, 0.2, 0.2, 1.0];
const eyes = [0.0, 0.0, 0.0, 1.0];
const nose = [0.0, 0.0, 0.0, 1.0];

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

function renderScene() {
  let globalRotMat = new Matrix4();
  globalRotMat.rotate(g_globalAngleX, 1, 0, 0);
  globalRotMat.rotate(g_globalAngleY, 0, 1, 0);
  globalRotMat.rotate(g_GlobalRotation, 0, 1, 0);
  gl.uniformMatrix4fv(u_GlobalRotation, false, globalRotMat.elements);

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  let explodeT = 0;
  if (g_isExploding) {
    explodeT = Math.min((performance.now() - g_explodeStartTime) / 1000, 1);
  }

  var body = new Cube();
  body.color = fur;
  body.matrix.setTranslate(-0.5, -0.5, 0.0);
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
  head.matrix.setTranslate(-0.3, -0.20, 0.55);
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
  upperlegFL.matrix.set(body.matrix);
  upperlegFL.matrix.setTranslate(-0.45, -0.25, 0.65);
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
  hoofFL.matrix.translate(0, -0.302, 0);
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
  upperlegBL.matrix.set(body.matrix);
  upperlegBL.matrix.setTranslate(-0.45, -0.25, 0.15);
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
  hoofBL.matrix.translate(0, -0.302, 0);
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
  upperlegFR.matrix.set(body.matrix);
  upperlegFR.matrix.setTranslate(0.25, -0.25, 0.65);
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
  hoofFR.matrix.translate(0, -0.302, 0);
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
  upperlegBR.matrix.set(body.matrix);
  upperlegBR.matrix.setTranslate(0.25, -0.25, 0.15);
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
  hoofBR.matrix.translate(0, -0.302, 0);
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
  tail.matrix.setTranslate(-0.05, -0.15, -0.15);
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

function clearCanvas() {
  g_shapesList = [];
  renderScene();
  var img = document.getElementById('reference');
  if (img) img.style.display = 'none';
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
  
  updateFPS();
  renderScene();
  requestAnimationFrame(tick);
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
