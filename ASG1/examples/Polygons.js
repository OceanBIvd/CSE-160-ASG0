class Polygon {
    constructor(vertices) {
        this.type = 'polygon';
        this.vertices = vertices; // Array of xy pairs
        this.color = [1.0, 1.0, 1.0, 1.0];
    }

    render() {
        const rgba = this.color;
        
        gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
        
        drawPolygon(this.vertices);
    }
}

// was helped debugged using chatgpt
function drawPolygon(vertices) {
    var vertexBuffer = gl.createBuffer();
    if (!vertexBuffer) {
        console.log('Failed to create the buffer object');
        return;
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices.flat()), gl.STATIC_DRAW);
    gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Position);
    
    gl.drawArrays(gl.TRIANGLE_FAN, 0, vertices.length / 2); // Assumes vertices is a flat array
}