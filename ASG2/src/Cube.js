class Cube{
    constructor(segments = 10){               // Constructor with default segments parameter
        this.type='cube';                     // Initialize type property as 'cube'
        this.color=[1.0,1.0,1.0,1.0];         // Sets theccolor of the cube to white
        this.matrix = new Matrix4();          // Initialize a 4x4 transformation matrix
    }
    render(){
        var rgba = this.color;                // Local variable for the cube's color

        // Set the color for the fragment shader
        gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);

        // Pass the transformation matrix to the vertex shader
        gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

        // Draw the front face of the cube using two triangles
        drawTriangle3D([0.0, 0.0, 0.0, 1.0, 1.0, 0.0, 1.0, 0.0, 0.0]);
        drawTriangle3D([0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0]);

        // Draw the back face of the cube using two triangles
        drawTriangle3D([0, 0, 1, 1, 0, 1, 1, 1, 1]);
        drawTriangle3D([0, 0, 1, 1, 1, 1, 0, 1, 1]);

        // Draw the bottom face of the cube using two triangles
        drawTriangle3D([0, 0, 0, 1, 0, 1, 1, 0, 0]);
        drawTriangle3D([0, 0, 0, 0, 0, 1, 1, 0, 1]);

        // Draw the left face of the cube using two triangles
        drawTriangle3D([0, 0, 0, 0, 1, 1, 0, 1, 0]);
        drawTriangle3D([0, 0, 0, 0, 0, 1, 0, 1, 1]);

        // Draw the right face of the cube using two triangles
        drawTriangle3D([1, 0, 0, 1, 1, 0, 1, 1, 1]);
        drawTriangle3D([1, 0, 0, 1, 1, 1, 1, 0, 1]);

        // Set a darker color for the top face
        gl.uniform4f(u_FragColor, rgba[0]*.9, rgba[1]*.9, rgba[2]*.9, rgba[3]);

        // Draw the top face of the cube using two triangles
        drawTriangle3D([0,1,0, 0,1,1, 1,1,1]);
        drawTriangle3D([0,1,0, 1,1,1, 1,1,0]);
    }
}