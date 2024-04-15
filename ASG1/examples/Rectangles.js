class Rectangle {
    constructor() {
        this.type = 'rectangle';
        this.position = [0.0, 0.0]; 
        this.color = [1.0, 1.0, 1.0, 1.0];
        this.size = 10.0;
    }

    render() {
        const xy = this.position;
        const rgba = this.color;
        const size = this.size;
        
        gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
        gl.uniform1f(u_Size, size);
        
        // Calculate vertices 
        const vertices = [
            xy[0] - size, xy[1] - size, // Bottom Left
            xy[0] - size, xy[1] + size, // Top Left
            xy[0] + size, xy[1] + size, // Top Right
            xy[0] + size, xy[1] - size  // Bottom Right
        ];

        drawRectangle(vertices);
    }
}

function drawRectangle(vertices) {
    var vertexBuffer = gl.createBuffer();
    if (!vertexBuffer) {
        console.log('Failed to create the buffer object');
        return;
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Position);
    
    // Draw the rectangle using two triangles
    gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
}