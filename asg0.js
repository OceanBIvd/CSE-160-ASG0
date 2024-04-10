// define ctx
var ctx;

function main() {
    // Retrieve <canvas> element
    var canvas = document.getElementById('example');
    if (!canvas) {
        console.log('Failed to retrieve the <canvas> element');
        return;
    }

    // Get the rendering context for 2D graphics and assign it to 'ctx'
    ctx = canvas.getContext('2d');

    // Instantiate a vector v1 using the Vector3 class
    var v1 = new Vector3([2.25, 2.25, 0]);

    // call drawVector to draw v1 in red
    drawVector(v1, 'red');
}

function drawVector(v, color) {
    ctx.beginPath(); // begin a new path for drawing
    ctx.strokeStyle = color; // set the color of the line

    ctx.moveTo(200, 200); // move to the center of the canvas

    // calculate the end point of the vector
    // scale the vector coordinates by 20
    var endPointX = 200 + v.elements[0] * 20;
    var endPointY = 200 - v.elements[1] * 20; // subtract because canvas y-coordinates go down

    // draw a line to the end point of the vector
    ctx.lineTo(endPointX, endPointY);

    // draw the path on the canvas
    ctx.stroke();
}

function handleDrawEvent() {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height); // Clear the canvas

    // read the x and y coordinates for v1 from the input boxes
    var x1 = parseFloat(document.getElementById('xCoord').value);
    var y1 = parseFloat(document.getElementById('yCoord').value);

    // create a new vector v1 with the input coordinates
    var v1 = new Vector3([x1, y1, 0]);

    // draw the new vector v1 in red
    drawVector(v1, 'red');

    // read the x and y coordinates for v2 from the new input boxes
    var x2 = parseFloat(document.getElementById('x2Coord').value);
    var y2 = parseFloat(document.getElementById('y2Coord').value);

    // create a new vector v2 with the input coordinates
    var v2 = new Vector3([x2, y2, 0]);

    // draw the new vector v2 in blue
    drawVector(v2, 'blue');
}

function handleDrawOperationEvent() {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);// clear the canvas

    // read the x and y coordinates for v1 and v2 from the input boxes
    var x1 = parseFloat(document.getElementById('xCoord').value);
    var y1 = parseFloat(document.getElementById('yCoord').value);
    var x2 = parseFloat(document.getElementById('x2Coord').value);
    var y2 = parseFloat(document.getElementById('y2Coord').value);

    // create vectors v1 and v2
    var v1 = new Vector3([x1, y1, 0]);
    var v2 = new Vector3([x2, y2, 0]);

    // draw v1 and v2
    drawVector(v1, 'red');
    drawVector(v2, 'blue');

    // read the operation and scalar value
    var operation = document.getElementById('operation').value;
    var scalar = parseFloat(document.getElementById('scalar').value);

    // perform operation and draw the result
    switch (operation) {
        case 'add':
            var v3 = new Vector3(v1.elements).add(v2);
            drawVector(v3, 'green');
            break;
        case 'sub':
            var v3 = new Vector3(v1.elements).sub(v2);
            drawVector(v3, 'green');
            break;
        case 'mul':
            var v3 = new Vector3(v1.elements).mul(scalar);
            var v4 = new Vector3(v2.elements).mul(scalar);
            drawVector(v3, 'green');
            drawVector(v4, 'green');
            break;
        case 'div':
            var v3 = new Vector3(v1.elements).div(scalar);
            var v4 = new Vector3(v2.elements).div(scalar);
            drawVector(v3, 'green');
            drawVector(v4, 'green');
            break;

            case 'magnitude':
                console.log('Magnitude of v1:', v1.magnitude());
                console.log('Magnitude of v2:', v2.magnitude());
                break;
    
            case 'normalize':
                var normV1 = new Vector3(v1.elements).normalize();
                var normV2 = new Vector3(v2.elements).normalize();
                drawVector(normV1, 'green');
                drawVector(normV2, 'green');
                break;

            case 'angleBetween':
                let angle = angleBetween(v1, v2);
                console.log(`Angle: ${angle.toFixed(2)}`);
                break;

            case 'area':
                let area = areaTriangle(v1, v2);
                console.log(`Area of the triangle: ${area.toFixed(2)}`);
                break;  
    }
}

function angleBetween(v1, v2) {
    let dotProduct = Vector3.dot(v1, v2);
    let magnitudeV1 = v1.magnitude();
    let magnitudeV2 = v2.magnitude();
    let cosTheta = dotProduct / (magnitudeV1 * magnitudeV2);

    // make sure cosTheta is between -1 to 1 range to avoid errors
    cosTheta = Math.max(-1, Math.min(1, cosTheta));

    let theta = Math.acos(cosTheta); // angle in radians
    let angleInDegrees = theta * (180 / Math.PI); // convert to degrees

    return angleInDegrees;
}

function areaTriangle(v1, v2) {
    let crossProduct = Vector3.cross(v1, v2);
    let area = 0.5 * crossProduct.magnitude(); // area of the triangle is half the magnitude of the cross product
    return area;
}