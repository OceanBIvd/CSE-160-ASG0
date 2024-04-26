// ColoredPoint.js (c) 2012 matsuda
// Vertex shader program
var VSHADER_SOURCE =`
  attribute vec4 a_Position;
  uniform mat4 u_ModelMatrix;
  uniform mat4 u_GlobalRotateMatrix;
  void main() {
    gl_Position = u_GlobalRotateMatrix * u_ModelMatrix * a_Position;
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
let u_ModelMatrix;
let u_GlobalRotateMatrix;

function setupWebGL(){
  // Retrieve <canvas> element
  canvas = document.getElementById('webgl');

  // Get the rendering context for WebGL
  gl = canvas.getContext("webgl", { preserveDrawingBuffer: true});
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }
  gl.enable(gl.DEPTH_TEST);
}

function connectVariablesToGLSL(){
  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to get the rendering context for WebGL');
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
  u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  if (!u_ModelMatrix) {
    console.log('Failed to get the storage location of u_ModelMatrix');
    return;
    }
  
  // Get the storage location of u_GlobalRotateMatrix
  u_GlobalRotateMatrix = gl.getUniformLocation(gl.program, 'u_GlobalRotateMatrix');
  if (!u_GlobalRotateMatrix) {
    console.log('Failed to get the storage location of u_GlobalRotateMatrix');
    return;
    }
    
    //Set the initial value for this matrix to identify
    var identityM = new Matrix4();
    gl.uniformMatrix4fv(u_ModelMatrix, false, identityM.elements);

}

// Constants
const POINT = 0;
const TRIANGLE = 1;
const CIRCLE = 2;

//Globals related to UI elements
let g_selectedColor = [1.0,1.0,1.0,1.0];
let g_selectedSize = 5;
let g_selectedType= POINT;
let g_globalAngle=0;
let g_yellowAngle = 0;
let g_magentaAngle = 0;
let g_yellowAnimation = false;
let g_magentaAnimation = false;

// Set up actions for the HTML UI elements
function addActionsForHtmlUI(){

    //Button events 
    document.getElementById('animationYellowOnButton').onclick =  function(){ g_yellowAnimation = true;};
    document.getElementById('animationYellowOffButton').onclick =  function(){ g_yellowAnimation = false;};

    document.getElementById('animationMagentaOnButton').onclick =  function(){ g_magentaAnimation = true;};
    document.getElementById('animationMagentaOffButton').onclick =  function(){ g_magentaAnimation = false;};

    //Slider Events
    document.getElementById('yellowSlide').addEventListener('input', function(){ g_yellowAngle = this.value; renderAllShapes();});
    document.getElementById('magentaSlide').addEventListener('input', function(){ g_magentaAngle = this.value; renderAllShapes();});


    //anlge Slider Events
    document.getElementById('angleSlide').addEventListener('input', function(){ g_globalAngle = this.value; renderAllShapes();});

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


requestAnimationFrame(tick);
}

var g_startTime = performance.now()/1000.0;
var g_seconds = performance.now()/1000.0-g_startTime

function tick(){

  g_seconds = performance.now()/1000.0-g_startTime;
  console.log(g_seconds);

  updateAnimationAngles();

  renderAllShapes();

  requestAnimationFrame(tick);
}

function updateAnimationAngles(){
  if(g_yellowAnimation){
    g_yellowAngle = (45*Math.sin(g_seconds));
  }
  if(g_magentaAnimation){
    g_magentaAngle = (45*Math.sin(3*g_seconds));
  }
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


  var globalRotMat = new Matrix4().rotate(g_globalAngle,0,1,0);
  gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMat.elements);  

  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.clear(gl.COLOR_BUFFER_BIT );

  //Draw a test triangle 
  //drawTriangle3D( [-1.0, 0.0, 0.0,   -0.5, -1.0, 0.0,    0.0,0.0,0.0]);

  //Draw a cube 
  var body = new Cube();
  body.color = [1.0, 0.0, 0.0, 1.0];
  body.matrix.translate(-.25, -.75,0.0);
  body.matrix.rotate(-5,1,0,0);
  body.matrix.scale(0.5,.3,.5);
  body.render();

  //Draw a left arm
  var yellow = new Cube();
  yellow.color = [1,1,0,1];
  yellow.matrix.setTranslate(0,-.5,0.0);
  yellow.matrix.rotate(-5,1,0,0);
  yellow.matrix.rotate(-g_yellowAngle,0,0,1);
  
  var yellowCoordinatesMat = new Matrix4(yellow.matrix);
  yellow.matrix.scale(0.25, .7, .5);
  yellow.matrix.translate(-.5,0,0);
  yellow.render();

  //Test box 
  var magenta = new Cube();
  magenta.color = [1,0,1,1];
  magenta.matrix = yellowCoordinatesMat;
  magenta.matrix.translate(0,0.65,0);
  magenta.matrix.rotate(-g_magentaAngle,0,0,1);
  magenta.matrix.scale(.3, .3, .3);
  magenta.matrix.translate(-.5,0,-0.001);
  magenta.render();

  


  //Check the time at the end of the function and show the web page 
  var duration = performance.now() - startTime;
  sendTextToHTML(" ms: " + Math.floor(duration) + " fps: " + Math.floor(10000/duration)/10, "numdot");
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