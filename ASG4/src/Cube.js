class Cube{
    constructor(segments = 10){
        this.type='cube';
        //this.position=[0.0,0.0,0.0];
        this.color=[1.0,1.0,1.0,1.0];
        //this.size=5.0;
        //this.segments = segments;
        this.matrix = new Matrix4();
        this.normalMatrix = new Matrix4();
        this.textureNum = -2;

        if (!Cube.initialized) {
            Cube.initBuffers();
            Cube.initialized = true;
        }
    }
    static initBuffers() {
        // Create a buffer for the cube's vertex positions.
        Cube.vertexBuffer = gl.createBuffer();

        // Select the vertexBuffer as the one to apply vertex operations to from here out.
        gl.bindBuffer(gl.ARRAY_BUFFER, Cube.vertexBuffer);

        // Now create an array of positions for the cube (including UVS)
        const vertices = new Float32Array([
            // Front face
            0, 0, 0, 0, 0,   1, 1, 0, 1, 1,   1, 0, 0, 1, 0,
            0, 0, 0, 0, 0,   0, 1, 0, 0, 1,   1, 1, 0, 1, 1,

            // Top face
            0, 1, 0, 0, 0,   0, 1, 1, 0, 1,   1, 1, 1, 1, 1,
            0, 1, 0, 0, 0,   1, 1, 1, 1, 1,   1, 1, 0, 1, 0,

            // Back face
            1, 0, 1, 1, 0,   0, 0, 1, 0, 0,   0, 1, 1, 0, 1,
            1, 0, 1, 1, 0,   0, 1, 1, 0, 1,   1, 1, 1, 1, 1,

            // Bottom face
            0, 0, 0, 0, 1,   1, 0, 0, 1, 1,   1, 0, 1, 1, 0,
            0, 0, 0, 0, 1,   1, 0, 1, 1, 0,   0, 0, 1, 0, 0,

            // Left face
            0, 0, 0, 1, 0,   0, 1, 1, 0, 1,   0, 1, 0, 1, 1,
            0, 0, 0, 1, 0,   0, 0, 1, 0, 0,   0, 1, 1, 0, 1,

            // Right face
            1, 0, 0, 1, 0,   1, 1, 1, 0, 1,   1, 1, 0, 1, 1,
            1, 0, 0, 1, 0,   1, 0, 1, 0, 0,   1, 1, 1, 0, 1
        ]);

        // Now pass the list of positions into WebGL to build the shape. We do this by creating a Float32Array from the JavaScript array, then use it to fill the current buffer.
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

        Cube.numVertices = vertices.length / 5;
    }

    render(){


        var rgba = this.color;


        gl.uniform1i(u_whichTexture, this.textureNum);

        // Pass the color of a point to u_FragColor variable
        gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);

        //Pass the matrix to a u_matrixmodel atrribute
        gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);


        //Front of the cube
        drawTriangle3DUVNormal(
            [0,0,0 ,  1,1,0,  1,0,0 ],
            [0,0,  1,1,  1,0],
            [0,0,-1, 0,0,-1, 0,0,-1]);
        
        drawTriangle3DUVNormal([0,0,0,  0,1,0,  1,1,0], [0,0, 0,1, 1,1], [0,0,-1, 0,0,-1, 0,0,-1]);



        // //Front of the Cube
        // drawTriangle3DUV( [0, 0, 0,   1, 1, 0,    1,0,0], [0,0, 1,1, 1,0]);
        // drawTriangle3DUV( [0, 0, 0,   0, 1, 0,    1,1,0], [0,0, 0,1, 1,1]);

        //gl.uniform4f(u_FragColor, rgba[0]*.9, rgba[1]*.9, rgba[2]*.9, rgba[3]);

        // Top of the cube
        drawTriangle3DUVNormal([0, 1, 0, 0, 1, 1, 1, 1, 1], [0, 0, 0, 1, 1, 1], [0,1,0,  0,1,0,  0,1,0] );
        drawTriangle3DUVNormal([0, 1, 0, 1, 1, 1, 1, 1, 0], [0, 0, 1, 1, 1, 0], [0,1,0,  0,1,0,  0,1,0] );

        //gl.uniform4f(u_FragColor, rgba[0]*.8, rgba[1]*.8, rgba[2]*.8, rgba[3]);

        //gl.uniform4f(u_FragColor, rgba[0]*.8, rgba[1]*.8, rgba[2]*.8, rgba[3]);
        // Right face
        drawTriangle3DUVNormal([1, 0, 0, 1, 1, 1, 1, 1, 0], [0, 0, 1, 1, 0, 1], [1,0,0,  1,0,0,  1,0,0]);
        drawTriangle3DUVNormal([1, 0, 0, 1, 0, 1, 1, 1, 1], [0, 0, 0, 1, 1, 1], [1,0,0,  1,0,0,  1,0,0]);

        //gl.uniform4f(u_FragColor, rgba[0]*.7, rgba[1]*.7, rgba[2]*.7, rgba[3]);
        // Left face
        drawTriangle3DUVNormal([0,0,0,  0,1,1,  0,1,0], [1, 0, 0, 1, 1, 1], [-1,0,0,  -1,0,0,  -1,0,0]);
        drawTriangle3DUVNormal([0,0,0,  0,0,1,  0,1,1], [1, 0, 1, 1, 0, 1], [-1,0,0,  -1,0,0,  -1,0,0]);

        // Bottom face
        //gl.uniform4f(u_FragColor, rgba[0]*.6, rgba[1]*.6, rgba[2]*.6, rgba[3]);
        drawTriangle3DUVNormal([0, 0, 0, 1, 0, 0, 1, 0, 1], [0, 1, 1, 1, 1, 0], [0,-1,0,  0,-1,0,  0,-1,0]);
        drawTriangle3DUVNormal([0, 0, 0, 1, 0, 1, 0, 0, 1], [0, 1, 1, 0, 0, 0], [0,-1,0,  0,-1,0,  0,-1,0]);

        // Back face
       // gl.uniform4f(u_FragColor, rgba[0]*.5, rgba[1]*.5, rgba[2]*.5, rgba[3]);
        drawTriangle3DUVNormal([1, 0, 1, 0, 0, 1, 0, 1, 1], [1, 0, 0, 0, 0, 1], [0,0,1,  0,0,1,  0,0,1]);
        drawTriangle3DUVNormal([1, 0, 1, 0, 1, 1, 1, 1, 1], [1, 0, 0, 1, 1, 1], [0,0,1,  0,0,1,  0,0,1]);
        

     }

    renderfast() {
        var rgba = this.color;

        gl.uniform1i(u_whichTexture, this.textureNum);
        gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
        gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

        // Bind the buffer and set up the vertex attribute pointers
        gl.bindBuffer(gl.ARRAY_BUFFER, Cube.vertexBuffer);

        const FSIZE = Float32Array.BYTES_PER_ELEMENT;

        // Assign the buffer object to a_Position variable
        gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, FSIZE * 5, 0);
        gl.enableVertexAttribArray(a_Position);

        // Assign the buffer object to a_UV variable
        gl.vertexAttribPointer(a_UV, 2, gl.FLOAT, false, FSIZE * 5, FSIZE * 3);
        gl.enableVertexAttribArray(a_UV);

        // Draw the cube
        gl.drawArrays(gl.TRIANGLES, 0, Cube.numVertices);
    }

}
