class Sphere {
  constructor(segments = 24, rings = 16) {
    this.type = 'Sphere';
    this.color = [1.0, 1.0, 1.0, 1.0];
    this.matrix = new Matrix4();
    this.textureNum = 0;
    this.texWeight = 1.0;
    this.segments = segments;
    this.rings = rings;
  }

  render() {
    gl.uniform4f(u_FragColor, this.color[0], this.color[1], this.color[2], this.color[3]);

    gl.uniform1i(u_useTexture, this.textureNum);
    
    gl.uniform1f(u_texColorWeight, this.texWeight);

    const modelMat = new Matrix4(this.matrix);
    if (typeof Cube !== 'undefined' && Cube.globalYOffset && !this.ignoreGlobalYOffset) {
      modelMat.translate(0, Cube.globalYOffset, 0);
    }
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMat.elements);

    drawSphere(this.segments, this.rings);
  }
}

function normalize(v) {
  const x = v[0], y = v[1], z = v[2];
  const len = Math.sqrt(x * x + y * y + z * z) || 1.0;
  return [x / len, y / len, z / len];
}

function drawSphere(segments, rings) {
  const positions = [];
  const normals = [];
  const uvs = [];

  const radius = 1.0;

  for (let i = 0; i < rings; i++) {
    const v0 = i / rings;
    const v1 = (i + 1) / rings;
    const phi0 = v0 * Math.PI - Math.PI / 2;
    const phi1 = v1 * Math.PI - Math.PI / 2;

    const y0 = Math.sin(phi0);
    const r0 = Math.cos(phi0);
    const y1 = Math.sin(phi1);
    const r1 = Math.cos(phi1);

    for (let j = 0; j < segments; j++) {
      const u0 = j / segments;
      const u1 = (j + 1) / segments;
      const theta0 = u0 * 2 * Math.PI;
      const theta1 = u1 * 2 * Math.PI;

      const x00 = r0 * Math.cos(theta0);
      const z00 = r0 * Math.sin(theta0);
      const x01 = r0 * Math.cos(theta1);
      const z01 = r0 * Math.sin(theta1);

      const x10 = r1 * Math.cos(theta0);
      const z10 = r1 * Math.sin(theta0);
      const x11 = r1 * Math.cos(theta1);
      const z11 = r1 * Math.sin(theta1);

      const v00 = [radius * x00, radius * y0, radius * z00];
      const v10 = [radius * x10, radius * y1, radius * z10];
      const v11 = [radius * x11, radius * y1, radius * z11];
      const v01 = [radius * x01, radius * y0, radius * z01];

      positions.push(...v00, ...v10, ...v11);
      normals.push(
        ...normalize(v00),
        ...normalize(v10),
        ...normalize(v11)
      );

      uvs.push(u0, v0, u0, v1, u1, v1);

      positions.push(...v00, ...v11, ...v01);
      normals.push(
        ...normalize(v00),
        ...normalize(v11),
        ...normalize(v01)
      );

      uvs.push(u0, v0, u1, v1, u1, v0);
    }
  }

  const posArray = new Float32Array(positions);
  const normalArray = new Float32Array(normals);
  const uvArray = new Float32Array(uvs);

  const vertexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, posArray, gl.DYNAMIC_DRAW);
  gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_Position);

  const uvBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, uvArray, gl.DYNAMIC_DRAW);
  gl.vertexAttribPointer(a_UV, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_UV);

  const normalBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, normalArray, gl.DYNAMIC_DRAW);
  gl.vertexAttribPointer(a_Normal, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_Normal);

  const vertexCount = posArray.length / 3;
  gl.drawArrays(gl.TRIANGLES, 0, vertexCount);
}
