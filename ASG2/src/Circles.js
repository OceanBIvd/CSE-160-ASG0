class Circle{
    constructor(segments = 10){           // Constructor with default segment value of 10
        this.type='circle';               // Sets the type property to 'circle'
        this.position=[0.0,0.0,0.0];      // Initializes the position in 3D space
        this.color=[1.0,1.0,1.0,1.0];     // Sets the initial color to white
        this.size=5.0;                    // Sets the initial size of the circle
        this.segments = segments;         // Number of segments for drawing the circle
    }
    render(){                             // Render method to draw the circle
        var xy = this.position;           // variable for the circle's position
        var rgba = this.color;            // variable for the circle's color
        var size = this.size;             // variable for the circle's size

        // Set the color in the WebGL fragment shader
        gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);

        // Calculate the step for drawing the segments
        var d = this.size/200.0;          // Delta calculated based on the size

        let angleStep = 360/this.segments; // Calculate the step for each angle based on segments
        for( var angle = 0; angle < 360; angle += angleStep){ // Loop to draw each segment
            let centerPt = [xy[0], xy[1]]; // Center point of the circle
            let angle1 = angle;            // Start angle of the segment
            let angle2 = angle + angleStep; // End angle of the segment
            let vec1 = [Math.cos(angle1*Math.PI/180)*d, Math.sin(angle1*Math.PI/180)*d]; // First vertex of the triangle
            let vec2 = [Math.cos(angle2*Math.PI/180)*d, Math.sin(angle2*Math.PI/180)*d]; // Second vertex of the triangle
            let pt1 = [centerPt[0] + vec1[0], centerPt[1] + vec1[1]]; // Calculated position of the first vertex
            let pt2 = [centerPt[0] + vec2[0], centerPt[1] + vec2[1]]; // Calculated position of the second vertex

            // Draw triangle from center to these two calculated points
            drawTriangle([xy[0], xy[1], pt1[0], pt1[1], pt2[0], pt2[1]]);
        }
    }
}