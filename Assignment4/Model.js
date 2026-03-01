class Model {
    constructor(filePath) {
        this.type = 'Model';
        this.filePath = filePath;
        this.color = [1.0, 1.0, 1.0, 1.0];
        this.matrix = new Matrix4();
        this.textureNum = 0;
        this.texWeight = 1.0;
        this.isFullyLoaded = false;
        this.vertexBuffer = null;
        this.normalBuffer = null;

        this.getFileContent();
    }

    parseModel(fileContent) {
        const lines = fileContent.split('\n');
        const allVertices = [];
        const allNormals = [];

        const unpackedVerts = [];
        const unpackedNormals = [];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line || line.startsWith('#')) continue;

            const tokens = line.split(/\s+/);

            if (tokens[0] === 'v') {
                allVertices.push(
                    parseFloat(tokens[1]),
                    parseFloat(tokens[2]),
                    parseFloat(tokens[3])
                );
            } else if (tokens[0] === 'vn') {
                allNormals.push(
                    parseFloat(tokens[1]),
                    parseFloat(tokens[2]),
                    parseFloat(tokens[3])
                );
            } else if (tokens[0] === 'f') {
                // assume triangles with v//vn format
                for (const face of [tokens[1], tokens[2], tokens[3]]) {
                    const indices = face.split('//');
                    const vIndex = (parseInt(indices[0], 10) - 1) * 3;
                    const nIndex = (parseInt(indices[1], 10) - 1) * 3;

                    unpackedVerts.push(
                        allVertices[vIndex],
                        allVertices[vIndex + 1],
                        allVertices[vIndex + 2]
                    );

                    unpackedNormals.push(
                        allNormals[nIndex],
                        allNormals[nIndex + 1],
                        allNormals[nIndex + 2]
                    );
                }
            }
        }

// I had Copilot generate this method to help me with the sizing of the obj
        if (unpackedVerts.length >= 3) {
            let minX = Infinity, maxX = -Infinity;
            let minY = Infinity, maxY = -Infinity;
            let minZ = Infinity, maxZ = -Infinity;

            for (let i = 0; i < unpackedVerts.length; i += 3) {
                const x = unpackedVerts[i];
                const y = unpackedVerts[i + 1];
                const z = unpackedVerts[i + 2];

                if (x < minX) minX = x; if (x > maxX) maxX = x;
                if (y < minY) minY = y; if (y > maxY) maxY = y;
                if (z < minZ) minZ = z; if (z > maxZ) maxZ = z;
            }

            const extentX = maxX - minX;
            const extentY = maxY - minY;
            const extentZ = maxZ - minZ;
            const maxExtent = Math.max(extentX, extentY, extentZ);

            if (maxExtent > 0) {
                const s = 1.0 / maxExtent;
                for (let i = 0; i < unpackedVerts.length; i++) {
                    unpackedVerts[i] *= s;
                }
            }
        }

        this.modelData = {
            vertices: new Float32Array(unpackedVerts),
            normals: new Float32Array(unpackedNormals)
        };
        this.isFullyLoaded = true;
    }

    render() {
        if (!this.isFullyLoaded) return;

        if (!this.vertexBuffer) {
            this.vertexBuffer = gl.createBuffer();
            this.normalBuffer = gl.createBuffer();
            if (!this.vertexBuffer || !this.normalBuffer) {
                console.log('Failed to create buffers for', this.filePath);
                return;
            }
        }

        gl.uniform4f(u_FragColor, this.color[0], this.color[1], this.color[2], this.color[3]);
        gl.uniform1i(u_useTexture, this.textureNum);
        gl.uniform1f(u_texColorWeight, this.texWeight);

        const modelMat = new Matrix4(this.matrix);
        if (typeof Cube !== 'undefined' && Cube.globalYOffset && !this.ignoreGlobalYOffset) {
            modelMat.translate(0, Cube.globalYOffset, 0);
        }
        gl.uniformMatrix4fv(u_ModelMatrix, false, modelMat.elements);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.modelData.vertices, gl.STATIC_DRAW);
        gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_Position);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.modelData.normals, gl.STATIC_DRAW);
        gl.vertexAttribPointer(a_Normal, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_Normal);

        let uvWasEnabled = false;
        if (typeof a_UV !== 'undefined' && a_UV >= 0) {
            uvWasEnabled = gl.getVertexAttrib(a_UV, gl.VERTEX_ATTRIB_ARRAY_ENABLED);
            if (uvWasEnabled) {
                gl.disableVertexAttribArray(a_UV);
            }
        }

        const count = this.modelData.vertices.length / 3;
        gl.drawArrays(gl.TRIANGLES, 0, count);

        if (typeof a_UV !== 'undefined' && a_UV >= 0 && uvWasEnabled) {
            gl.enableVertexAttribArray(a_UV);
        }
    }

    async getFileContent() {
        try {
            const response = await fetch(this.filePath);
            if (!response.ok) {
                throw new Error(`Could not load file "${this.filePath}". Are you sure the file name/path are correct?`);
            }

            const fileContent = await response.text();
            this.parseModel(fileContent);
        } catch (e) {
            console.error(`Something went wrong when loading ${this.filePath}. Error:`, e);
        }
    }
}
