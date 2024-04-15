// ColoredPoint.js (c) 2012 matsuda
// Vertex shader program
var VSHADER_SOURCE =`
  attribute vec4 a_Position;
  uniform float u_Size;
  void main() {
    gl_Position = a_Position;
    gl_PointSize = u_Size;
  }`

// Fragment shader program
var FSHADER_SOURCE =`
  precision mediump float;
  uniform vec4 u_FragColor;
  void main() {
    gl_FragColor = u_FragColor;
  }`

// Global Variables
let canvas;
let gl;
let a_Position;
let u_FragColor;
let u_Size;

function setupWebGL(){
  // Retrieve <canvas> element
  canvas = document.getElementById('webgl');

  // Get the rendering context for WebGL
  gl = canvas.getContext("webgl", { preserveDrawingBuffer: true});
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }
}

function connectVariablesToGLSL(){
  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }

  // // Get the storage location of a_Position
  a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return;
  }

  // Get the storage location of u_FragColor
  u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
  if (!u_FragColor) {
    console.log('Failed to get the storage location of u_FragColor');
    return;
  }

  // Get the storage location of u_Size
  u_Size = gl.getUniformLocation(gl.program, 'u_Size');
  if (!u_Size) {
    console.log('Failed to get the storage location of u_Size');
    return;
    }
}

// Constants
const POINT = 0;
const TRIANGLE = 1;
const CIRCLE = 2;

//Globals related to UI elements
let g_selectedColor = [1.0,1.0,1.0,1.0];
let g_selectedSize = 5;
let g_selectedType= POINT;

// Set up actions for the HTML UI elements
function addActionsForHtmlUI(){

    //Button events (Shape Type)
    document.getElementById('green').onclick=function(){g_selectedColor = [0.0,1.0,0.0,1.0]; };
    document.getElementById('red').onclick=function(){g_selectedColor = [1.0,0.0,0.0,1.0]; };
    document.getElementById('clearButton').onclick=function(){g_shapesList = []; renderAllShapes(); };

    document.getElementById('pointButton').onclick=function(){g_selectedType = POINT};
    document.getElementById('triButton').onclick=function(){g_selectedType = TRIANGLE};
    document.getElementById('circleButton').onclick=function(){g_selectedType = CIRCLE};


    //Slider Events
    document.getElementById('redSlide').addEventListener('mouseup', function(){ g_selectedColor[0] = this.value/100;});
    document.getElementById('greenSlide').addEventListener('mouseup', function(){ g_selectedColor[1] = this.value/100;});
    document.getElementById('blueSlide').addEventListener('mouseup', function(){ g_selectedColor[2] = this.value/100;});

    //Size Slider Events
    document.getElementById('sizeSlide').addEventListener('mouseup', function(){ g_selectedSize = this.value;});

    document.getElementById('segmentSlide').addEventListener('input', function(){
        if(g_selectedType === CIRCLE){
            g_shapesList[g_shapesList.length - 1].segments = parseInt(this.value);
            renderAllShapes(); // Render with new segments
        }
    });
    document.getElementById('recreateButton').onclick = recreateDrawing;

    document.getElementById('colorPicker').addEventListener('change', function() { //color picker
        const color = this.value;
        const r = parseInt(color.substr(1, 2), 16) / 255;
        const g = parseInt(color.substr(3, 2), 16) / 255;
        const b = parseInt(color.substr(5, 2), 16) / 255;
        g_selectedColor = [r, g, b, 1.0];
    });

    //variables for undo and redo
    let undoStack = [];
    let redoStack = [];

    document.getElementById('undoButton').onclick = function() {
    if (g_shapesList.length > 0) {
        redoStack.push(g_shapesList.pop());
        renderAllShapes();
    }
};

    document.getElementById('redoButton').onclick = function() {
        if (redoStack.length > 0) {
            g_shapesList.push(redoStack.pop());
            renderAllShapes();
        }
    };


}

function main() {
    // set up canvas and gl variables 
    setupWebGL();
    //Set up GLSL shader programs and connect GLSL variables
    connectVariablesToGLSL();

    //Set up actions for the HTML UI elements
    addActionsForHtmlUI();

   // Register function (event handler) to be called on a mouse press
   canvas.onmousedown =  click;
   canvas.onmousemove = function(ev) { if(ev.buttons == 1){ click(ev)}};

  // Specify the color for clearing <canvas>
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT);
}

var g_shapesList = [];

function click(ev) {
   
  //Extract the event click and return it in WebGL coordinates
  [x,y] = convertCoordinatesEventToGl(ev);

  //Create and store new point
  let point ;
  if(g_selectedType == POINT){
    point = new Point();

  }else if (g_selectedType == TRIANGLE){
    point = new Triangle();
  } else if (g_selectedType === CIRCLE) {
    let segments = parseInt(document.getElementById('segmentSlide').value);
    point = new Circle(segments);
  }

  point.position=[x,y];
  point.color=g_selectedColor.slice();
  point.size=g_selectedSize;
  g_shapesList.push(point);

  //Draw every shape that is supposed to be in the canvas 
  renderAllShapes();

}

//Extract the event click and return it in WebGl coordinates
function convertCoordinatesEventToGl(ev){
    var x = ev.clientX; // x coordinate of a mouse pointer
    var y = ev.clientY; // y coordinate of a mouse pointer
    var rect = ev.target.getBoundingClientRect();
  
    x = ((x - rect.left) - canvas.width/2)/(canvas.width/2);
    y = (canvas.height/2 - (y - rect.top))/(canvas.height/2);

    return([x,y]);
}

function renderAllShapes(){

    var startTime = performance.now();

  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT);
  
  // var len = g_points.length;
  var len = g_shapesList.length;

  for(var i = 0; i < len; i++) {
    g_shapesList[i].render(); // Call render on each Point object
  }

  //Check the time at the end of the function and show the web page 
  var duration = performance.now() - startTime;
  sendTextToHTML("numdot: " + len + " ms: " + Math.floor(duration) + " fps: " + Math.floor(10000/duration)/10, "numdot");
}

//Set the text of the HTML element
function sendTextToHTML(text, htmlID){
    var htmlElm = document.getElementById(htmlID);
    if (!htmlElm){
        console.log("Failed to to get " + htmlID + " from HTML");
        return;
    }
    htmlElm.innerHTML = text;
}

function recreateDrawing() {

    // Draw each triangle directly by setting its vertices and color
    drawTriangleAndSetItsColor([-1, 0.85, -0.67, 0.85, -0.67, 0.40], [.8, .8, .8, 1.0]);
    drawTriangleAndSetItsColor([-1, 0.85, -1, 0.24, -0.67, 0.40], [.8, .8, .8, 1.0]);
    drawTriangleAndSetItsColor([-0.67, 0.85, -.34, 0.53, -0.67, 0.40], [.8, .8, .8, 1.0]);
    drawTriangleAndSetItsColor([-1, 0.25, -.40, 0.53, -0.34, 0.24], [.8, .8, .8, 1.0]);
    drawTriangleAndSetItsColor([-1, 0.25, -.83, -0.37, -0.34, 0.24], [.8, .8, .8, 1.0]);
    drawTriangleAndSetItsColor([-.85, -0.38, -.34, -0.37, -0.34, .24], [.8, .8, .8, 1.0]);
    drawTriangleAndSetItsColor([-.51, -0.23, -.42, -0.37, -0.60, -0.37], [1, 1, 1, 1.0]); // eye
    drawTriangleAndSetItsColor([-.34, 0.24, 0, 0.24, -0.34, -0.36], [.8, .8, .8, 1.0]);
    drawTriangleAndSetItsColor([.32, -0.37, 0, 0.24, -0.34, -0.36], [.8, .8, .8, 1.0]);
    drawTriangleAndSetItsColor([.32, 0.24, 0, 0.24, -0.34, -0.36], [.8, .8, .8, 1.0]);
    drawTriangleAndSetItsColor([.32, 0.24, .65, -0.37, -0.34, -0.36], [.8, .8, .8, 1.0]);
    drawTriangleAndSetItsColor([.48, -0.20, .57, -0.37, .44, -0.37], [1, 1, 1, 1.0]); // eye
    drawTriangleAndSetItsColor([.32, 0.24, .64, -0.37, .98, .24], [.8, .8, .8, 1.0]);
    drawTriangleAndSetItsColor([.32, 0.24, .33, .54, .98, .24], [.8, .8, .8, 1.0]);
    drawTriangleAndSetItsColor([.32, 0.50, .97, .84, .98, .24], [.8, .8, .8, 1.0]);
    drawTriangleAndSetItsColor([.32, 0.50, .30, .80, .67, .68], [.8, .8, .8, 1.0]);
    drawTriangleAndSetItsColor([.49, 1, .30, .80, .67, .68], [.8, .8, .8, 1.0]);
    drawTriangleAndSetItsColor([.49, 1, .82, 1, .65, .70], [.8, .8, .8, 1.0]);
    drawTriangleAndSetItsColor([.50, 1, .60, 1, .70, .70], [.8, .8, .8, 1.0]);
    drawTriangleAndSetItsColor([.71, .83, .82, .67, .58, .60], [.8, .8, .8, 1.0]);
    drawTriangleAndSetItsColor([.97, .80, .82, 1, .65, .71], [.8, .8, .8, 1.0]); // finished ear
    drawTriangleAndSetItsColor([.64, -.37, .80, -.05, .82, -.37], [.8, .8, .8, 1.0]);
    drawTriangleAndSetItsColor([.32, -.35, .32, -.53, .82, -.37], [.8, .8, .8, 1.0]);
    drawTriangleAndSetItsColor([.82, -.82, .32, -.53, .82, -.37], [.8, .8, .8, 1.0]);
    drawTriangleAndSetItsColor([.82, -.82, .32, -.53, .32, -.97], [.8, .8, .8, 1.0]);
    drawTriangleAndSetItsColor([-.02, -.69, .32, -.53, .32, -.97], [.8, .8, .8, 1.0]);
    drawTriangleAndSetItsColor([-.02, -.69, -.34, -.98, -.34, -.52], [.8, .8, .8, 1.0]);
    drawTriangleAndSetItsColor([-.82, -.84, -.34, -.98, -.34, -.52], [.8, .8, .8, 1.0]);
    drawTriangleAndSetItsColor([-.82, -.84, -.83, -.38, -.34, -.52], [.8, .8, .8, 1.0]);
    drawTriangleAndSetItsColor([-.34, -.35, -.83, -.38, -.34, -.52], [.8, .8, .8, 1.0]);
    drawTriangleAndSetItsColor([-.199, -.845, .165, -.84, -0.014, -.695], [1, .626, .82, 1.0]); //mouth
    drawTriangleAndSetItsColor([-.34, -.53, -.35, -.30, -.07, -.38], [.8, .8, .8, 1.0]);
    drawTriangleAndSetItsColor([-.10, -.38, 0.33, -.38, .19, -.58], [.8, .8, .8, 1.0]);//fix
    drawTriangleAndSetItsColor([-.185, -.365, 0.35, -.385, .08, -.12], [.8, .8, .8, 1.0]);//fix2
    drawTriangleAndSetItsColor([.17, -.39, 0.2, -.67, .32, -.53], [.8, .8, .8, 1.0]);
    drawTriangleAndSetItsColor([.17, -.39, 0.32, -.39, .32, -.53], [.8, .8, .8, 1.0]);
}

function drawTriangleAndSetItsColor(vertices, color) {
    gl.uniform4f(u_FragColor, color[0], color[1], color[2], color[3]);
    drawTriangle(vertices);
}