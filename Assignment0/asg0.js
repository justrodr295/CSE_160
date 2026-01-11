// DrawTriangle.js (c) 2012 matsuda
function main() {  
  // Retrieve <canvas> element
  var canvas = document.getElementById('example');  
  if (!canvas) { 
    console.log('Failed to retrieve the <canvas> element');
    return false; 
  } 

  var ctx = canvas.getContext('2d');

  const v1 = new Vector3([2.25, 2.25, 0.0]);

  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, 400, 400);

  handleDrawEvent();
}

function drawVector(v, color) {
  const scale = 20;
  const x = 200;
  const y = 200;

  var ctx = document.getElementById('example').getContext('2d');
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + v.elements[0] * scale, y - v.elements[1] * scale);
  ctx.strokeStyle = color;
  ctx.stroke();
}

function handleDrawEvent() {
  var ctx = document.getElementById('example').getContext('2d');

  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, 400, 400);

  var x = parseFloat(document.getElementsByName('x')[0].value);
  var y = parseFloat(document.getElementsByName('y')[0].value);

  const v1 = new Vector3([x, y, 0.0]);
  drawVector(v1, 'red');

  var x = parseFloat(document.getElementsByName('x')[1].value);
  var y = parseFloat(document.getElementsByName('y')[1].value);

  const v2 = new Vector3([x, y, 0.0]);
  drawVector(v2, 'blue');
}

function handleDrawOperationEvent() {
  var ctx = document.getElementById('example').getContext('2d');

  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, 400, 400);

  var x = parseFloat(document.getElementsByName('x')[0].value);
  var y = parseFloat(document.getElementsByName('y')[0].value);

  const v1 = new Vector3([x, y, 0.0]);
  drawVector(v1, 'red');

  var x = parseFloat(document.getElementsByName('x')[1].value);
  var y = parseFloat(document.getElementsByName('y')[1].value);

  const v2 = new Vector3([x, y, 0.0]);
  drawVector(v2, 'blue');

  const op = document.getElementById('operation').value;
  const scalar = parseFloat(document.getElementById('scalar').value);

  if (op === 'add') {
    const v3 = new Vector3(v1.elements);
    v3.add(v2);
    drawVector(v3, 'green');
  } else if (op === 'sub') {
    const v3 = new Vector3(v1.elements);
    v3.sub(v2);
    drawVector(v3, 'green');
  } else if (op === 'mul') {
    const v3 = new Vector3(v1.elements);
    const v4 = new Vector3(v2.elements);
    v3.mul(scalar);
    v4.mul(scalar);
    drawVector(v3, 'green');
    drawVector(v4, 'green');
  } else if (op === 'div') {
    const v3 = new Vector3(v1.elements);
    const v4 = new Vector3(v2.elements);
    v3.div(scalar);
    v4.div(scalar);
    drawVector(v3, 'green');
    drawVector(v4, 'green');
  } else if (op === 'mag') {
    console.log('Magnitude of v1: ' + v1.magnitude());
    console.log('Magnitude of v2: ' + v2.magnitude());
  } else if (op === 'norm') {
    drawVector(v1.normalize(), 'green');
    drawVector(v2.normalize(), 'green');
  } else if (op === 'ang') {
    const dot = Vector3.dot(v1, v2);
    const mag1 = v1.magnitude();
    const mag2 = v2.magnitude();
    const angle = Math.acos(dot / (mag1 * mag2)) * (180.0 / Math.PI);
    console.log('Angle: ' + angle + ' degrees');
  } else if (op === 'area') {
    const cross = Vector3.cross(v1, v2);
    const area = 0.5 * cross.magnitude();
    console.log('Area of triangle: ' + area);
  }
}