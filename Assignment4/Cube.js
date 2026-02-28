class Cube {
  constructor() {
    this.type = 'Cube';
    this.color = [1.0, 1.0, 1.0, 1.0];
    this.matrix = new Matrix4();
    this.textureNum = 0;
    this.texWeight = 1.0;
  }

  render() {
    // Pass the color of a point to u_FragColor variable
    gl.uniform4f(u_FragColor, this.color[0], this.color[1], this.color[2], this.color[3]);

    gl.uniform1i(u_useTexture, this.textureNum);

    gl.uniform1f(u_texColorWeight, this.texWeight);

    var modelMat = new Matrix4(this.matrix);
    if (typeof Cube !== 'undefined' && Cube.globalYOffset && !this.ignoreGlobalYOffset) {
      modelMat.translate(0, Cube.globalYOffset, 0);
    }
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMat.elements);

    drawTriangle3DUVNormal(
      [0.0, 0.0, 0.0,  1.0, 1.0, 0.0,  1.0, 0.0, 0.0],
      [0,0, 1,1, 1,0],
      [0,0,-1, 0,0,-1, 0,0,-1]
    );
    drawTriangle3DUVNormal(
      [0.0, 0.0, 0.0,  0.0, 1.0, 0.0,  1.0, 1.0, 0.0],
      [0,0, 0,1, 1,1],
      [0,0,-1, 0,0,-1, 0,0,-1]
    );

    drawTriangle3DUVNormal(
      [0.0, 0.0, 1.0,  1.0, 0.0, 1.0,  1.0, 1.0, 1.0],
      [0,0, 1,0, 1,1],
      [0,0,1, 0,0,1, 0,0,1]
    );
    drawTriangle3DUVNormal(
      [0.0, 0.0, 1.0,  1.0, 1.0, 1.0,  0.0, 1.0, 1.0],
      [0,0, 1,1, 0,1],
      [0,0,1, 0,0,1, 0,0,1]
    );

    drawTriangle3DUVNormal(
      [0.0, 0.0, 0.0,  0.0, 0.0, 1.0,  0.0, 1.0, 1.0],
      [0,0, 1,0, 1,1],
      [-1,0,0, -1,0,0, -1,0,0]
    );
    drawTriangle3DUVNormal(
      [0.0, 0.0, 0.0,  0.0, 1.0, 1.0,  0.0, 1.0, 0.0],
      [0,0, 1,1, 0,1],
      [-1,0,0, -1,0,0, -1,0,0]
    );

    drawTriangle3DUVNormal(
      [1.0, 0.0, 0.0,  1.0, 1.0, 0.0,  1.0, 1.0, 1.0],
      [0,0, 1,1, 1,0],
      [1,0,0, 1,0,0, 1,0,0]
    );
    drawTriangle3DUVNormal(
      [1.0, 0.0, 0.0,  1.0, 1.0, 1.0,  1.0, 0.0, 1.0],
      [0,0, 1,1, 0,1],
      [1,0,0, 1,0,0, 1,0,0]
    );

    drawTriangle3DUVNormal(
      [0.0, 0.0, 0.0,  1.0, 0.0, 1.0,  1.0, 0.0, 0.0],
      [0,0, 1,1, 1,0],
      [0,1,0, 0,1,0, 0,1,0]
    );
    drawTriangle3DUVNormal(
      [0.0, 0.0, 0.0,  0.0, 0.0, 1.0,  1.0, 0.0, 1.0],
      [0,0, 0,1, 1,1],
      [0,1,0, 0,1,0, 0,1,0]
    );

    drawTriangle3DUVNormal(
      [0.0, 1.0, 0.0,  1.0, 1.0, 0.0,  1.0, 1.0, 1.0],
      [0,0, 1,0, 1,1],
      [0,-1,0, 0,-1,0, 0,-1,0]
    );
    drawTriangle3DUVNormal(
      [0.0, 1.0, 0.0,  1.0, 1.0, 1.0,  0.0, 1.0, 1.0],
      [0,0, 1,1, 0,1],
      [0,-1,0, 0,-1,0, 0,-1,0]
    );
  }

  renderFast() {
    if (!Cube._fastInit) {
      Cube._fastInit = true;
      Cube._vertices = new Float32Array([
        0.0, 0.0, 0.0,   1.0, 1.0, 0.0,   1.0, 0.0, 0.0,
        0.0, 0.0, 0.0,   0.0, 1.0, 0.0,   1.0, 1.0, 0.0,
        0.0, 0.0, 1.0,   1.0, 0.0, 1.0,   1.0, 1.0, 1.0,
        0.0, 0.0, 1.0,   1.0, 1.0, 1.0,   0.0, 1.0, 1.0,
        0.0, 0.0, 0.0,   0.0, 0.0, 1.0,   0.0, 1.0, 1.0,
        0.0, 0.0, 0.0,   0.0, 1.0, 1.0,   0.0, 1.0, 0.0,
        1.0, 0.0, 0.0,   1.0, 1.0, 0.0,   1.0, 1.0, 1.0,
        1.0, 0.0, 0.0,   1.0, 1.0, 1.0,   1.0, 0.0, 1.0,
        0.0, 0.0, 0.0,   1.0, 0.0, 1.0,   1.0, 0.0, 0.0,
        0.0, 0.0, 0.0,   0.0, 0.0, 1.0,   1.0, 0.0, 1.0,
        0.0, 1.0, 0.0,   1.0, 1.0, 0.0,   1.0, 1.0, 1.0,
        0.0, 1.0, 0.0,   1.0, 1.0, 1.0,   0.0, 1.0, 1.0
      ]);

      Cube._uvs = new Float32Array([
        0,0,  1,1,  1,0,
        0,0,  0,1,  1,1,
        0,0,  1,0,  1,1,
        0,0,  1,1,  0,1,
        0,0,  1,0,  1,1,
        0,0,  1,1,  0,1,
        0,0,  1,1,  1,0,
        0,0,  1,1,  0,1,
        0,0,  1,1,  1,0,
        0,0,  0,1,  1,1,
        0,0,  1,0,  1,1,
        0,0,  1,1,  0,1
      ]);

      Cube._normals = new Float32Array([
        // Front face (0, 0, -1)
        0,0,-1,  0,0,-1,  0,0,-1,
        0,0,-1,  0,0,-1,  0,0,-1,
        // Back face (0, 0, 1)
        0,0,1,   0,0,1,   0,0,1,
        0,0,1,   0,0,1,   0,0,1,
        // Left face (-1, 0, 0)
        -1,0,0, -1,0,0, -1,0,0,
        -1,0,0, -1,0,0, -1,0,0,
        // Right face (1, 0, 0)
        1,0,0,   1,0,0,   1,0,0,
        1,0,0,   1,0,0,   1,0,0,
        // Bottom face (0, 1, 0)
        0,1,0,   0,1,0,   0,1,0,
        0,1,0,   0,1,0,   0,1,0,
        // Top face (0, -1, 0)
        0,-1,0,  0,-1,0,  0,-1,0,
        0,-1,0,  0,-1,0,  0,-1,0
      ]);

      Cube._vertexBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, Cube._vertexBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, Cube._vertices, gl.STATIC_DRAW);

      Cube._uvBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, Cube._uvBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, Cube._uvs, gl.STATIC_DRAW);

      Cube._normalBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, Cube._normalBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, Cube._normals, gl.STATIC_DRAW);

      Cube._vertexCount = Cube._vertices.length / 3;
    }

    gl.uniform4f(u_FragColor, this.color[0], this.color[1], this.color[2], this.color[3]);
    gl.uniform1i(u_useTexture, this.textureNum);
    gl.uniform1f(u_texColorWeight, this.texWeight);
      var modelMat = new Matrix4(this.matrix);
      if (typeof Cube !== 'undefined' && Cube.globalYOffset && !this.ignoreGlobalYOffset) {
        modelMat.translate(0, Cube.globalYOffset, 0);
      }
      gl.uniformMatrix4fv(u_ModelMatrix, false, modelMat.elements);

    gl.bindBuffer(gl.ARRAY_BUFFER, Cube._vertexBuffer);
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Position);

    gl.bindBuffer(gl.ARRAY_BUFFER, Cube._uvBuffer);
    gl.vertexAttribPointer(a_UV, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_UV);

    gl.bindBuffer(gl.ARRAY_BUFFER, Cube._normalBuffer);
    gl.vertexAttribPointer(a_Normal, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Normal);

    gl.drawArrays(gl.TRIANGLES, 0, Cube._vertexCount);
  }
}
