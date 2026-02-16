class Circle {
  constructor() {
    this.type = 'Circle';
    this.position = [0.0, 0.0, 0.0];
    this.color = [1.0, 1.0, 1.0, 1.0];
    this.size = 5.0;
    this.segments = 10.0
  }

  render() {
    var xy = this.position;
    var rgba = this.color;
    var radius = this.size/200.0;

    // Pass the color of a point to u_FragColor variable
    gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
    
    let d = 360 / this.segments;
    // Draw
    for (let angle = 0; angle < 360; angle += d) {
      let angle1 = angle * Math.PI / 180;
      let angle2 = (angle + d) * Math.PI / 180;
      let x1 = xy[0] + radius * Math.cos(angle1);
      let y1 = xy[1] + radius * Math.sin(angle1);
      let x2 = xy[0] + radius * Math.cos(angle2);
      let y2 = xy[1] + radius * Math.sin(angle2);
      drawTriangle([xy[0], xy[1], x1, y1, x2, y2]);
    }
  }
}

function drawTriangle(vertices) {
  var n = 3; // The number of vertices

  // Create a buffer object
  var vertexBuffer = gl.createBuffer();
  if (!vertexBuffer) {
    console.log('Failed to create the buffer object');
    return -1;
  }

  // Bind the buffer object to target
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  // Write date into the buffer object
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.DYNAMIC_DRAW);

  // Assign the buffer object to a_Position variable
  gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);

  // Enable the assignment to a_Position variable
  gl.enableVertexAttribArray(a_Position);

  gl.drawArrays(gl.TRIANGLES, 0, n);
}
