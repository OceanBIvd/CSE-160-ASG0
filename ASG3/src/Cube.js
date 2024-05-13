class Cube{
    constructor(segments = 10){
        this.type='cube';
        //this.position=[0.0,0.0,0.0];
        this.color=[1.0,1.0,1.0,1.0];
        //this.size=5.0;
        //this.segments = segments;
        this.matrix = new Matrix4();
        this.textureNum = -2;
    }
    render(){


        var rgba = this.color;


        gl.uniform1i(u_whichTexture, this.textureNum);

        // Pass the color of a point to u_FragColor variable
        gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);

        //Pass the matrix to a u_matrixmodel atrribute
        gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);



        //Front of the Cube
        drawTriangle3DUV( [0, 0, 0,   1, 1, 0,    1,0,0], [0,0, 1,1, 1,0]);
        drawTriangle3DUV( [0, 0, 0,   0, 1, 0,    1,1,0], [0,0, 0,1, 1,1]);

        gl.uniform4f(u_FragColor, rgba[0]*.9, rgba[1]*.9, rgba[2]*.9, rgba[3]);

        // Top of the cube
        drawTriangle3DUV([0, 1, 0, 0, 1, 1, 1, 1, 1], [0, 0, 0, 1, 1, 1]);
        drawTriangle3DUV([0, 1, 0, 1, 1, 1, 1, 1, 0], [0, 0, 1, 1, 1, 0]);

        // Back face
        drawTriangle3DUV([1, 0, 1, 0, 0, 1, 0, 1, 1], [1, 0, 0, 0, 0, 1]);
        drawTriangle3DUV([1, 0, 1, 0, 1, 1, 1, 1, 1], [1, 0, 0, 1, 1, 1]);

        // Bottom face
        drawTriangle3DUV([0, 0, 0, 1, 0, 0, 1, 0, 1], [0, 1, 1, 1, 1, 0]);
        drawTriangle3DUV([0, 0, 0, 1, 0, 1, 0, 0, 1], [0, 1, 1, 0, 0, 0]);

        // Left face
        drawTriangle3DUV([0,0,0,  0,1,1,  0,1,0], [1, 0, 0, 1, 1, 1]);
        drawTriangle3DUV([0,0,0,  0,0,1,  0,1,1], [1, 0, 1, 1, 0, 1]);
        
        // Right face
        drawTriangle3DUV([1, 0, 0, 1, 1, 1, 1, 1, 0], [0, 0, 1, 1, 0, 1]);
        drawTriangle3DUV([1, 0, 0, 1, 0, 1, 1, 1, 1], [0, 0, 0, 1, 1, 1]);
     }
   
     renderFast(){


        var rgba = this.color;


        //gl.uniform1i(u_whichTexture, this.textureNum);

        // Pass the color of a point to u_FragColor variable
        gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);

        //Pass the matrix to a u_matrixmodel atrribute
        gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

        var allverts = [];

        //Front of cube 
        allverts=allverts.concat([0,0,0,  1,1,0, 1,0,0]);
        allverts=allverts.concat([0,0,0,  0,1,0, 1,1,0]);

        //Top of cube 
        allverts=allverts.concat([0,1,0,  0,1,1, 1,1,1]);
        allverts=allverts.concat([0,1,0,  1,1,1, 1,1,0]);

        //Right of cube 
        allverts=allverts.concat([1,1,0,  1,1,1, 1,0,0]);
        allverts=allverts.concat([1,0,0,  1,1,1, 1,0,1]);

        //Left of cube 
        allverts=allverts.concat([0,1,0,  0,1,1, 0,0,0]);
        allverts=allverts.concat([0,0,0,  0,1,1, 0,0,1]);

        //Bottom of cube 
        allverts=allverts.concat([0,0,0,  0,0,1, 1,0,1]);
        allverts=allverts.concat([0,0,0,  1,0,1, 1,0,0]);

        //Back of cube 
        allverts=allverts.concat([0,0,1,  1,1,1, 1,0,1]);
        allverts=allverts.concat([0,0,1,  0,1,1, 1,1,1]);

        drawTriangle3D(allverts);



     }

}