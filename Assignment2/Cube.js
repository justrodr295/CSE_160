class Cube {
  constructor() {
    this.type = 'Cube';
    this.color = [1.0, 1.0, 1.0, 1.0];
    this.matrix = new Matrix4();
  }

  render() {
    // Pass the color of a point to u_FragColor variable
    gl.uniform4f(u_FragColor, this.color[0], this.color[1], this.color[2], this.color[3]);

    gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

    drawTriangle3D([0.0, 0.0, 0.0,  1.0, 1.0, 0.0,  1.0, 0.0, 0.0,])
    drawTriangle3D([0.0, 0.0, 0.0,  0.0, 1.0, 0.0,  1.0, 1.0, 0.0,])

    drawTriangle3D([0.0, 0.0, 1.0,  1.0, 0.0, 1.0,  1.0, 1.0, 1.0]);
    drawTriangle3D([0.0, 0.0, 1.0,  1.0, 1.0, 1.0,  0.0, 1.0, 1.0]);

    drawTriangle3D([0.0, 0.0, 0.0,  0.0, 0.0, 1.0,  0.0, 1.0, 1.0]);
    drawTriangle3D([0.0, 0.0, 0.0,  0.0, 1.0, 1.0,  0.0, 1.0, 0.0]);

    drawTriangle3D([1.0, 0.0, 0.0,  1.0, 1.0, 0.0,  1.0, 1.0, 1.0]);
    drawTriangle3D([1.0, 0.0, 0.0,  1.0, 1.0, 1.0,  1.0, 0.0, 1.0]);

    drawTriangle3D([0.0, 0.0, 0.0,  1.0, 0.0, 1.0,  1.0, 0.0, 0.0]);
    drawTriangle3D([0.0, 0.0, 0.0,  0.0, 0.0, 1.0,  1.0, 0.0, 1.0]);

    drawTriangle3D([0.0, 1.0, 0.0,  1.0, 1.0, 0.0,  1.0, 1.0, 1.0]);
    drawTriangle3D([0.0, 1.0, 0.0,  1.0, 1.0, 1.0,  0.0, 1.0, 1.0]);
  }
}
