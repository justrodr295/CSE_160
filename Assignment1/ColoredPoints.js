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
}

function drawPicture() {
  clearCanvas();

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

  // Cowlick
  let cowLeft = new Triangle();
  cowLeft.color = purple;
  cowLeft.vertices = [-0.15, 0.3, 0.05, 0.3, 0.05, 0.48];
  g_shapesList.push(cowLeft);

  let cowRight = new Triangle();
  cowRight.color = purple;
  cowRight.vertices = [0.05, 0.3, 0.18, 0.3, 0.18, 0.42];
  g_shapesList.push(cowRight);

  // Eyes
  addQuad([-0.18, 0.10], [-0.08, 0.10], [-0.08, 0.00], [-0.18, 0.00], brown);
  addQuad([0.08, 0.10], [0.18, 0.10], [0.18, 0.00], [0.08, 0.00], brown);

  // Beak
  let t2 = new Triangle();
  t2.color = yellow;
  t2.vertices = [-0.05, 0.00, 0.05, 0.00, 0.00, -0.08];
  g_shapesList.push(t2);

  // Tie
  let t3 = new Triangle();
  t3.color = yellow;
  t3.vertices = [-0.2, -0.2, -0.2, -0.4, 0.0, -0.3];
  g_shapesList.push(t3);

  let t4 = new Triangle();
  t4.color = yellow;
  t4.vertices = [0.2, -0.2, 0.2, -0.4, 0.0, -0.3];
  g_shapesList.push(t4);

  // Arms
  addQuad([-0.55, -0.45], [-0.4, -0.35], [-0.4, -0.15], [-0.55, -0.25], purple);

  addQuad([0.4, -0.35], [0.55, -0.45], [0.55, -0.25], [0.4, -0.15], purple);

  // Initials
  // J
  addQuad([-0.09, -0.4], [-0.05, -0.4], [-0.05, -0.6], [-0.09, -0.6], purple);
  addQuad([-0.15, -0.56], [-0.09, -0.56], [-0.09, -0.6], [-0.15, -0.6], purple);

  let triLeft = new Triangle();
  triLeft.color = purple;
  triLeft.vertices = [-0.15, -0.56, -0.15, -0.53, -0.11, -0.56];
  g_shapesList.push(triLeft);

  // R
  addQuad([-0.03, -0.4], [0.01, -0.4], [0.01, -0.6], [-0.03, -0.6], purple);
  addQuad([0.01, -0.4], [0.05, -0.4], [0.05, -0.45], [0.01, -0.45], purple);
  addQuad([0.05, -0.45], [0.09, -0.45], [0.09, -0.49], [0.05, -0.49], purple);
  addQuad([0.01, -0.49], [0.05, -0.49], [0.05, -0.53], [0.01, -0.53], purple);
  addQuad([0.05, -0.53], [0.09, -0.53], [0.09, -0.6], [0.05, -0.6], purple);

  renderAllShapes();
}

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
