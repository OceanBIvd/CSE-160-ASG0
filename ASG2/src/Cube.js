class Cube{
    constructor(segments = 10){
        this.type='cube';
        //this.position=[0.0,0.0,0.0];
        this.color=[1.0,1.0,1.0,1.0];
        //this.size=5.0;
        //this.segments = segments;
        this.matrix = new Matrix4();
    }
    render(){


        var rgba = this.color;


        // Pass the color of a point to u_FragColor variable
        gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);

        //Pass the matrix to a u_matrixmodel atrribute
        gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);



        //Front of the Cube
        drawTriangle3D( [0.0, 0.0, 0.0,   1.0, 1.0, 0.0,    1.0,0.0,0.0]);
        drawTriangle3D( [0.0, 0.0, 0.0,   0.0, 1.0, 0.0,    1.0,1.0,0.0]);

        // Back face
        drawTriangle3D([0, 0, 1, 1, 0, 1, 1, 1, 1]);
        drawTriangle3D([0, 0, 1, 1, 1, 1, 0, 1, 1]);

        // Bottom face
        drawTriangle3D([0, 0, 0, 1, 0, 1, 1, 0, 0]);
        drawTriangle3D([0, 0, 0, 0, 0, 1, 1, 0, 1]);

        // Left face
        drawTriangle3D([0, 0, 0, 0, 1, 1, 0, 1, 0]);
        drawTriangle3D([0, 0, 0, 0, 0, 1, 0, 1, 1]);

        // Right face
        drawTriangle3D([1, 0, 0, 1, 1, 0, 1, 1, 1]);
        drawTriangle3D([1, 0, 0, 1, 1, 1, 1, 0, 1]);

        gl.uniform4f(u_FragColor, rgba[0]*.9, rgba[1]*.9, rgba[2]*.9, rgba[3]);


        //top of cube 
        drawTriangle3D([0,1,0,  0,1,1, 1,1,1]);
        drawTriangle3D([0,1,0,  1,1,1, 1,1,0]);
        }
   // }
}