// ColoredPoint.js (c) 2012 matsuda
// Vertex shader program
var VSHADER_SOURCE =`
  attribute vec4 a_Position;
  uniform float u_Size;
  void main() {
  gl_Position = a_Position;
  gl_PointSize = u_Size;
  }`;

// Fragment shader program
var FSHADER_SOURCE =`
  precision mediump float;
  uniform vec4 u_FragColor;
  void main() {
    gl_FragColor = u_FragColor;
  }`;

let canvas, gl, a_Position, u_FragColor, u_Size;

function setupWebGL() {
  // Retrieve <canvas> element
  canvas = document.getElementById('webgl');

  // Get the rendering context for WebGL
  gl = canvas.getContext("webgl", { preserveDrawingBuffer: true});
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }
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

  u_Size = gl.getUniformLocation(gl.program, 'u_Size');
  if (!u_Size) {
    console.log('Failed to get the storage location of u_Size');
    return;
  }
}

let g_selectedColor = [1.0, 1.0, 1.0, 1.0]; // Initial color: white
let g_selectedSize = 10.0; // Initial size
let g_selectedShape = 'Point'; // Initial shape type
let g_segments = 10;
let g_mode = 'draw'; // draw or game

function setHTMLUi() {
  document.getElementById('redButton').addEventListener ("click", function() {
    g_selectedColor = [1.0, 0.0, 0.0, 1.0]; // Red
  });

  document.getElementById('greenButton').addEventListener ("click", function() {
    g_selectedColor = [0.0, 1.0, 0.0, 1.0]; // Green
  });

  document.getElementById('blueButton').addEventListener ("click", function() {
    g_selectedColor = [0.0, 0.0, 1.0, 1.0]; // Blue
  });

  document.getElementById('redslider').addEventListener ("mouseup", function() {
    g_selectedColor[0] = this.value / 100; // Red
  });

  document.getElementById('greenslider').addEventListener ("mouseup", function() {
    g_selectedColor[1] = this.value / 100; // Green
  });

  document.getElementById('blueslider').addEventListener ("mouseup", function() {
    g_selectedColor[2] = this.value / 100; // Blue
  });

  document.getElementById('point').addEventListener ("click", function() {
    g_selectedShape = 'Point'; // Point
  });

  document.getElementById('triangle').addEventListener ("click", function() {
    g_selectedShape = 'Triangle'; // Triangle
  });

  document.getElementById('circle').addEventListener ("click", function() {
    g_selectedShape = 'Circle'; // Circle
  });

  document.getElementById('size').addEventListener ("mouseup", function() {
    g_selectedSize = this.value; // Size
  });

  document.getElementById('segments').addEventListener ("mouseup", function() {
    g_segments = this.value; // Segments
  });
}

function main() {
  setupWebGL();

  connectVariablesToGLSL();

  setHTMLUi();

  // Register function (event handler) to be called on a mouse press
  canvas.onmousedown = function(ev){ click(ev) };
  canvas.onmousemove = function(ev){ if(ev.buttons==1) click(ev) };

  // Specify the color for clearing <canvas>
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT);
}

var g_shapesList = [];

function click(ev) {
  if (g_mode === "game") {
    handleGameMouse(ev);
  }

  [x, y] = convertCoordinatesEventToGL(ev);

  let point;
  // Store the coordinates to g_points arrays
  if (g_selectedShape == 'Point') {
    point = new Point();
  } else if (g_selectedShape == 'Triangle') {
    point = new Triangle();
  } else {
    point = new Circle();
    point.segments = g_segments;
  }
  point.position = [x, y];
  point.color = g_selectedColor.slice();
  point.size = g_selectedSize;
  g_shapesList.push(point);

  renderAllShapes();
}

function convertCoordinatesEventToGL(ev) {
  var x = ev.clientX;
  var y = ev.clientY;
  var rect = ev.target.getBoundingClientRect();

  x = ((x - rect.left) - canvas.width/2)/(canvas.width/2);
  y = (canvas.height/2 - (y - rect.top))/(canvas.height/2);

  return ([x, y]);
}

function renderAllShapes() {
  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT);

  var len = g_shapesList.length;
  for(var i = 0; i < len; i++) {
    g_shapesList[i].render();
  }
}

function clearCanvas() {
  g_shapesList = [];
  renderAllShapes();
  var img = document.getElementById('reference');
  if (img) img.style.display = 'none';
}

function drawPicture() {
  clearCanvas();
  var img = document.getElementById('reference');
  if (img) img.style.display = 'inline-block';

  g_shapesList = [];

  const purple = [0.6, 0.2, 0.8, 1];
  const yellow = [1.0, 0.9, 0.2, 1];
  const gray = [0.7, 0.7, 0.7, 1];
  const brown = [0.5, 0.3, 0.1, 1];

  // Body
  addQuad([-0.4, -0.7], [0.4, -0.7], [0.4, -0.2], [-0.4, -0.2], gray);

  // Head
  addQuad([-0.3,  0.05], [0.3, 0.05], [0.3, 0.3], [-0.3, 0.3], purple);
  addQuad([-0.3, -0.2], [0.3, -0.2], [0.3,  0.05], [-0.3,  0.05], gray);

  // Hair
  let t1 = new Triangle();
  t1.color = purple;
  t1.vertices = [-0.15, 0.3, 0.05, 0.3, 0.05, 0.48];
  g_shapesList.push(t1);

  let t2 = new Triangle();
  t2.color = purple;
  t2.vertices = [0.05, 0.3, 0.18, 0.3, 0.18, 0.42];
  g_shapesList.push(t2);

  // Eyes
  addQuad([-0.18, 0.10], [-0.08, 0.10], [-0.08, 0.00], [-0.18, 0.00], brown);
  addQuad([0.08, 0.10], [0.18, 0.10], [0.18, 0.00], [0.08, 0.00], brown);

  // Beak
  let t3 = new Triangle();
  t3.color = yellow;
  t3.vertices = [-0.05, 0.00, 0.05, 0.00, 0.00, -0.08];
  g_shapesList.push(t3);

  // Tie
  let t4 = new Triangle();
  t4.color = yellow;
  t4.vertices = [-0.2, -0.2, -0.2, -0.4, 0.0, -0.3];
  g_shapesList.push(t4);

  let t5 = new Triangle();
  t5.color = yellow;
  t5.vertices = [0.2, -0.2, 0.2, -0.4, 0.0, -0.3];
  g_shapesList.push(t5);

  // Arms
  addQuad([-0.55, -0.45], [-0.4, -0.35], [-0.4, -0.15], [-0.55, -0.25], purple);

  addQuad([0.4, -0.35], [0.55, -0.45], [0.55, -0.25], [0.4, -0.15], purple);

  // Initials
  // J
  addQuad([-0.09, -0.4], [-0.05, -0.4], [-0.05, -0.6], [-0.09, -0.6], purple);
  addQuad([-0.15, -0.56], [-0.09, -0.56], [-0.09, -0.6], [-0.15, -0.6], purple);

  let hook = new Triangle();
  hook.color = purple;
  hook.vertices = [-0.15, -0.56, -0.15, -0.53, -0.11, -0.56];
  g_shapesList.push(hook);

  // R
  addQuad([-0.03, -0.4], [0.01, -0.4], [0.01, -0.6], [-0.03, -0.6], purple);
  addQuad([0.01, -0.4], [0.05, -0.4], [0.05, -0.45], [0.01, -0.45], purple);
  addQuad([0.05, -0.45], [0.09, -0.45], [0.09, -0.49], [0.05, -0.49], purple);
  addQuad([0.01, -0.49], [0.05, -0.49], [0.05, -0.53], [0.01, -0.53], purple);
  addQuad([0.05, -0.53], [0.09, -0.53], [0.09, -0.6], [0.05, -0.6], purple);

  renderAllShapes();
}

// Helper to make a rectangle out of two triangles
function addQuad(a, b, c, d, color) {
  let triangle1 = new Triangle();
  triangle1.color = color;
  triangle1.vertices = [a[0],a[1], b[0],b[1], c[0],c[1]];

  let triangle2 = new Triangle();
  triangle2.color = color;
  triangle2.vertices = [a[0],a[1], c[0],c[1], d[0],d[1]];

  g_shapesList.push(triangle1);
  g_shapesList.push(triangle2);
}

let g_gameActive = false;
let g_score = 0;
let g_timeLeft = 10.0;

let g_target = null;
let g_player = null;
let g_timerInterval = null;

function startGame() {
  g_mode = "game";
  g_gameActive = true;

  g_score = 0;
  g_timeLeft = 10.0;

  g_savedShapes = g_shapesList.slice();

  g_shapesList = [];

  spawnTarget();
  spawnPlayer();

  updateUI();

  if (g_timerInterval) clearInterval(g_timerInterval);
  g_timerInterval = setInterval(gameTick, 100);
}

function spawnTarget() {
  let c = new Circle();
  c.color = [1, 0, 0, 1];
  c.size = 15;
  c.segments = 20;

  c.position = [
    Math.random() * 1.6 - 0.8,
    Math.random() * 1.6 - 0.8
  ];

  g_target = c;
  g_shapesList.push(c);
}

function spawnPlayer() {
  let p = new Circle();
  p.color = [0, 1, 0, 1];
  p.size = 10;
  p.segments = 12;

  p.position = [0, 0];

  g_player = p;
  g_shapesList.push(p);
}

function checkCollision() {
  let dx = g_player.position[0] - g_target.position[0];
  let dy = g_player.position[1] - g_target.position[1];

  let dist = Math.sqrt(dx * dx + dy * dy);

  let r1 = g_player.size / 200.0;
  let r2 = g_target.size / 200.0;

  if (dist < r1 + r2) {
    g_score++;
    updateUI();

    g_shapesList = g_shapesList.filter(s => s !== g_target);

    spawnTarget();
  }
}

function gameTick() {
  if (!g_gameActive) return;

  g_timeLeft -= 0.1;

  if (g_timeLeft <= 0) {
    endGame();
  }

  updateUI();
}

function endGame() {
  g_gameActive = false;
  g_mode = "draw";

  clearInterval(g_timerInterval);

  alert("Your time's up! Score: " + g_score);

  g_shapesList = g_savedShapes || [];

  renderAllShapes();
}

function updateUI() {
  document.getElementById("score").innerText = "Score: " + g_score;
  document.getElementById("time").innerText =
    "Time: " + g_timeLeft.toFixed(1);
}

function handleGameMouse(ev) {
  let [x, y] = convertCoordinatesEventToGL(ev);

  g_player.position = [x, y];
  checkCollision();
  renderAllShapes();
}
