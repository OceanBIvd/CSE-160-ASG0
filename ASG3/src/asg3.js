// Vertex shader programa
var VSHADER_SOURCE =`
  precision mediump float;
  attribute vec4 a_Position; 
  attribute vec2 a_UV;
  varying vec2 v_UV;
  uniform mat4 u_ModelMatrix;
  uniform mat4 u_ViewMatrix;
  uniform mat4 u_GlobalRotateMatrix;
  uniform mat4 u_ProjectionMatrix;
  void main() {
    //gl_Position = u_GlobalRotateMatrix * u_ModelMatrix * a_Position;
    gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_GlobalRotateMatrix * u_ModelMatrix * a_Position;
    v_UV = a_UV;
  }`

// Fragment shader program
var FSHADER_SOURCE =`
  precision mediump float;
  varying vec2 v_UV;
  uniform vec4 u_FragColor;
  uniform sampler2D u_Sampler0;
  uniform sampler2D u_Sampler1;
  uniform int u_whichTexture;
  void main() {

    if(u_whichTexture == -2){
      gl_FragColor = u_FragColor; //use color

    }else if (u_whichTexture == -1){ //use UV debug color
      gl_FragColor = vec4(v_UV,1,1);

    }else if (u_whichTexture == 0){ //use texture0
      gl_FragColor = texture2D(u_Sampler0, v_UV);

    }else if (u_whichTexture == 1){ //use texture1
      gl_FragColor = texture2D(u_Sampler1, v_UV);

    } else{ //error put reddish
      gl_FragColor = vec4(1,.2,.2,1);
    }


  }`

// Global Variables
let canvas;
let gl;
let a_Position;
let a_UV;
let u_FragColor;
let u_Size;
let u_ModelMatrix;
let u_ProjectionMatrix;
let u_ViewMatrix;
let u_GlobalRotateMatrix;
let u_whichTexture;
let u_Sampler0;    
let u_Sampler1;

// Global rotation angles for mouse movement
let g_xMRotation = 0; 
let g_yMRotation = 0;
let g_zMRotation = 0;


let wingFlapAngle = 0; // Current angle for wing flapping
let wingFlapDirection = 1; // Direction of wing flap: 1 for up, -1 for down

let beakMovementAngle = 0;
let beakDirection = 1;
let beakMaxRotation = 10; // Maximum rotation in degrees

let legMovementAngle = 0; // Current angle for leg movement
let legDirection = 1; // Direction of leg movement: 1 for forward, -1 for backward
let legMaxRotation = 20; // Maximum rotation in degrees for the leg movement

let wattleDirection = 1; // Initial direction for wattle animation
let feetDirection = 1; // Initial direction for feet animation
let wattleAngle = 0; // Initialize wattle angle for animation
let feetAngle = 0;

function setupWebGL(){
  canvas = document.getElementById('webgl'); // Get canvas element by ID
  gl = canvas.getContext("webgl", { preserveDrawingBuffer: true, depth: true }); // Get WebGL context with options
  
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL'); // Error handling
    return;
  }
  gl.enable(gl.DEPTH_TEST); // Enable depth testing
  gl.depthFunc(gl.LEQUAL);

  gl.disable(gl.BLEND);
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

  a_UV = gl.getAttribLocation(gl.program, 'a_UV');
  if (a_UV < 0) {
    console.log('Failed to get the storage location of a_UV');
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

  u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
  if (!u_ViewMatrix) {
    console.log('Failed to get the storage location of u_ViewMatrix');
    return;
    }

  u_ProjectionMatrix = gl.getUniformLocation(gl.program, 'u_ProjectionMatrix');
  if (!u_ProjectionMatrix) {
    console.log('Failed to get the storage location of u_ProjectionMatrix');
    return;
  }


  // Get the storage location of the u_Sampler
  u_Sampler0 = gl.getUniformLocation(gl.program, 'u_Sampler0');
  if(!u_Sampler0){
    console.log('Failed to get the storage location of u_Sampler0');
    return ;
  }

  // Retrieve locations for all the uniforms and attributes
  u_whichTexture = gl.getUniformLocation(gl.program, 'u_whichTexture');
  if (!u_whichTexture) {
      console.log('Failed to get the storage location of u_whichTexture');
      return;
  }

  u_Sampler1 = gl.getUniformLocation(gl.program, 'u_Sampler1');
  if (!u_Sampler1){
    console.log('Failed to get the storage location of u_Sampler1');
    return;
  }

    //Set the initial value for this matrix to identify
    var identityM = new Matrix4();
    gl.uniformMatrix4fv(u_ModelMatrix, false, identityM.elements);

    updateGlobalRotationMatrix();
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

let wingAnimation = false;
let beakAnimation = false;
let legAnimation = false;
let wattleAnimation = false;
let feetAnimation = false;

// Set up actions for the HTML UI elements
// Set up HTML UI element interactions
function addActionsForHtmlUI(){
  // Existing slider and button actions
  document.getElementById('xAxisSlide').addEventListener('input', function() {
    g_xMRotation = parseInt(this.value);
    updateGlobalRotationMatrix();
  });

  document.getElementById('yAxisSlide').addEventListener('input', function() {
    g_yMRotation = parseInt(this.value);
    updateGlobalRotationMatrix();
  });

  // New sliders for chicken parts
  document.getElementById('wingFlapSlide').addEventListener('input', function() {
    wingFlapAngle = parseInt(this.value);
  });

  document.getElementById('beakMovementSlide').addEventListener('input', function() {
    beakMovementAngle = parseInt(this.value);
  });

  document.getElementById('legMovementSlide').addEventListener('input', function() {
    legMovementAngle = parseInt(this.value);
  });


  document.getElementById('wingAnimationToggle').onclick = function() {
    wingAnimation = !wingAnimation; // Toggle the wing animation state
  };

  document.getElementById('beakAnimationToggle').onclick = function() {
    beakAnimation = !beakAnimation; // Toggle the beak animation state
  };

  document.getElementById('legAnimationToggle').onclick = function() {
    legAnimation = !legAnimation; // Toggle the leg animation state
  };


  document.getElementById('resetButton').onclick = function() {
    // Reset all transformations and animations
    g_xMRotation = 0;
    g_yMRotation = 0;
    wingFlapAngle = 0;
    beakMovementAngle = 0;
    legMovementAngle = 0;
    wattleAngle = 0;
    feetAngle = 0;
    
    // Update sliders back to default values
    document.getElementById('xAxisSlide').value = 0;
    document.getElementById('yAxisSlide').value = 0;
    document.getElementById('wingFlapSlide').value = 0;
    document.getElementById('beakMovementSlide').value = 0;
    document.getElementById('legMovementSlide').value = 0;
    document.getElementById('wattleTiltSlide').value = 0;
    document.getElementById('feetTiltSlide').value = 0;
    
    // Re-render all shapes
    renderAllShapes();
  };

  document.getElementById('toggleAllAnimationsButton').onclick = function() {
    // Toggle the state of all animations
    let animationsAreOn = wingAnimation || beakAnimation || legAnimation || wattleAnimation || feetAnimation;
    wingAnimation = !animationsAreOn;
    beakAnimation = !animationsAreOn;
    legAnimation = !animationsAreOn;
    wattleAnimation = !animationsAreOn;
    feetAnimation = !animationsAreOn;
    
    // Update button text based on animation state
    this.textContent = animationsAreOn ? "Turn All Animations On" : "Turn All Animations Off";
  };

}

// function initTextures(gl, n) { // (Part4)

//   var image = new Image(); // Create an image object
//   if (!image){
//     console.log('Failed to create the image object');
//     return false;
//   }

//   // Register the event handler to be called on loading an image
//   image.onload = function(){ sendTextureToGLSL(image); };
//   // Tell the browser to load an image
//   image.src = 'sky.jpg';

//   return true;
// }

function initTextures(gl, textureId, imageUrl) {
  var image = new Image(); // Create an image object
  image.onload = function() {
    loadTexture(gl, textureId, image);
  };
  image.src = imageUrl;
}


function updateGlobalRotationMatrix() {
  let xRad = g_xMRotation * Math.PI / 180;
  let yRad = g_yMRotation * Math.PI / 180;
  
  // Create a new rotation matrix from X and Y rotations only
  let globalRotMat = new Matrix4().rotate(xRad, 1, 0, 0)  // Rotation around X-axis
                                   .rotate(yRad, 0, 1, 0); // Rotation around Y-axis
  gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMat.elements);
}

// function sendTextureToGLSL( image) { // (Part5)

//   var texture = gl.createTexture(); // Create a texture object

//   if (!texture){
//     console.log('Failed to create the texture object');
//     return false;
//   }

//   gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1); // Flip the image's y axis
//   // Enable the texture unit 0
//   gl.activeTexture(gl.TEXTURE0);
//   // Bind the texture object to the target
//   gl.bindTexture(gl.TEXTURE_2D, texture);
//   // Set the texture parameters
//   gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
//   // Set the texture image
//   gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
//   // Set the texture unit 0 to the sampler
//   gl.uniform1i(u_Sampler0, 0);
  
//   console.log('finished loadTexture')
// }

function loadTexture(gl, textureId, image) {
  var texture = gl.createTexture(); // Create a texture object
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1); // Flip the image's y axis
  gl.activeTexture(gl.TEXTURE0 + textureId); // Activate the appropriate texture unit
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
  
  if (textureId === 0) {
    gl.uniform1i(u_Sampler0, 0);
  } else if (textureId === 1) {
    gl.uniform1i(u_Sampler1, 1);
  }
}

function main() {
    // set up canvas and gl variables 
    setupWebGL();
    //Set up GLSL shader programs and connect GLSL variables
    connectVariablesToGLSL();

    //Set up actions for the HTML UI elements
    addActionsForHtmlUI();

    let isDragging = false; // Flag for mouse drag state
    let lastMouseX = -1, lastMouseY = -1; // Last mouse positions

    canvas.onmousedown = function(ev) {
      isDragging = true; // Set dragging to true
      [lastMouseX, lastMouseY] = [ev.clientX, ev.clientY]; // Store mouse down position
    };

    canvas.onmouseup = function(ev) {
      isDragging = false; // Set dragging to false
    };

    canvas.onmousemove = function(ev) {
      if (isDragging) {
        let [currentX, currentY] = [ev.clientX, ev.clientY]; // Get current mouse position
        let deltaX = currentX - lastMouseX; // Calculate horizontal movement
        let deltaY = currentY - lastMouseY; // Calculate vertical movement
        rotateModel(deltaX, deltaY); // Rotate model based on mouse movement
        [lastMouseX, lastMouseY] = [currentX, currentY]; // Update last mouse positions
      }
    };
  

    initTextures(gl, 0, 'sky.jpg');
    initTextures(gl, 1, 'flower.jpg'); 


  // Specify the color for clearing <canvas>
  gl.clearColor(0.0, 0.0, 0.0, 1.0);


requestAnimationFrame(tick);
}

function rotateModel(deltaX, deltaY) {
  g_xMRotation -= deltaY / 100 * 100; // Update global X rotation based on deltaY
  g_yMRotation -= deltaX / 100 * 100; // Update global Y rotation based on deltaX
  renderAllShapes(); // Redraw all shapes
}

var g_startTime = performance.now()/1000.0;
var g_seconds = performance.now()/1000.0-g_startTime

function tick(){

  g_seconds = performance.now()/1000.0-g_startTime;
  //console.log(g_seconds);

  updateAnimationAngles();

  renderAllShapes();

  requestAnimationFrame(tick);
}

function updateAnimationAngles() {
  // Wing animation toggle logic
  if (wingAnimation) {
    wingFlapAngle += wingFlapDirection * 2; // Increment or decrement the wing flap angle
    if (wingFlapAngle > 50 || wingFlapAngle < 0) { // Reverse direction if maximum/minimum is reached
      wingFlapDirection *= -1;
    }
  }

  // Beak animation toggle logic
  if (beakAnimation) {
    beakMovementAngle += beakDirection * 0.5; // Increment the angle at a chosen rate
    if (beakMovementAngle > beakMaxRotation || beakMovementAngle < 0) {
      beakDirection *= -1; // Reverse the direction when limits are reached
    }
  }

  // Leg animation toggle logic
  if (legAnimation) {
    legMovementAngle += legDirection * 1; // Increment the angle at a chosen rate
    if (legMovementAngle > legMaxRotation || legMovementAngle < -legMaxRotation) {
      legDirection *= -1; // Reverse the direction when limits are reached
    }
  }

  // Wattle animation toggle logic (example of a simple oscillation animation)
  if (wattleAnimation) {
    wattleAngle += wattleDirection * 0.7; // Adjust wattle angle based on direction
    if (wattleAngle > 10 || wattleAngle < -10) { // Check bounds
      wattleDirection *= -1; // Reverse direction
    }
  }

  if (feetAnimation) {
    feetAngle += feetDirection * 0.7; // Adjust feet angle based on direction
    if (feetAngle > 20 || feetAngle < -20) { // Check bounds
      feetDirection *= -1; // Reverse direction
    }
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

  //Pass the Projection Matrix 
  var projMat = new Matrix4();
  projMat.setPerspective(60, canvas.width/canvas.height, .1, 1000);
  gl.uniformMatrix4fv(u_ProjectionMatrix, false, projMat.elements);

  //Pass the view Matrix
  var viewMat = new Matrix4();
  viewMat.setLookAt(0,0,3, 0,0,-100,0,1,0);
  gl.uniformMatrix4fv(u_ViewMatrix, false, viewMat.elements);

  let globalRotMat = new Matrix4().rotate(g_xMRotation, 1, 0, 0).rotate(g_yMRotation, 0, 1, 0); // Create global rotation matrix
  gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMat.elements);  

  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.clear(gl.COLOR_BUFFER_BIT );
  //Base transformation for the whole chicken: smaller scale and flipped
  let baseTransform = new Matrix4().scale(0.7, 0.7, 0.7); // Scale down to 50%
  baseTransform.rotate(330, 0, 1, 0); // Rotate 180 degrees to flip the chicken


  //sky 
  var skybox = new Cube();
  skybox.color = [1,0,0,1];
  skybox.textureNum = 0; // Assuming texture unit 0 has the sky texture
  skybox.matrix.scale(50, 50, 50); // Adjust size as needed
  skybox.matrix.translate(-0.5, -0.5, -0.5); // Center the cube
  skybox.render();
  
  //Floor
  var floor = new Cube();
  floor.color = [0.0,1.0,0.0,1.0];
  floor.textureNum = -2;
  floor.matrix.translate(0,-.75,0.0);
  floor.matrix.scale(10,0,10);
  floor.matrix.translate(-.5,0,-0.5);
  floor.render();

  // Body of the Chicken
  let body = new Cube();
  body.textureNum = 1;
  body.color = [0.961,1,1,1.00]; // White body
  body.matrix = new Matrix4(baseTransform).translate(-.20, -0.4, 0.0).scale(0.5, 0.5, 0.8); // Apply base transformation
  body.render();

  // Head of the Chicken
  let head = new Cube();
  head.color = [0.961,1,1,1.00]; // White head
  head.matrix = new Matrix4(baseTransform).translate(-.15, -0.1, .70).scale(0.40, 0.5, 0.25); // Apply base transformation
  head.render();

  // Top of Beak of the Chicken
  let beak = new Cube();
  beak.color = [.804,.655,.38, 1.0]; // Orange beak
  beak.matrix = new Matrix4(baseTransform).translate(-0.15, 0.2, .95).scale(0.40, 0.05, 0.1); // Apply base transformation
  beak.render();

  // Render bottom part of the beak with animation
  let beak2 = new Cube();
  beak2.color = [0.639, 0.514, 0.298, 1.0];
  beak2.matrix = new Matrix4(baseTransform)
    .translate(-0.15, 0.15, 0.95)
    .rotate(beakMovementAngle, 1, 0, 0) // Apply rotation for opening/closing motion from slider
    .scale(0.40, 0.05, 0.1);
  beak2.render();

// Render wattle with the same animation as the bottom part of the beak
let wattle = new Cube();
wattle.color = [.769, 0.129, 0.153, 1.0];
let wattleTransform = new Matrix4(baseTransform)
  .translate(0.00, 0.05, 0.95) // Adjust the position according to your model's structure
  .rotate(beakMovementAngle, 1, 0, 0) // Synchronize the rotation with the bottom beak
  .scale(0.10, 0.1, 0.1);
wattle.matrix = wattleTransform;
wattle.render();

  // Eyes of the Chicken
  let eye1 = new Cube();
  eye1.color = [0.0, 0.0, 0.0, 1.0]; // Black eye
  eye1.matrix = new Matrix4(baseTransform).translate(0.2, 0.25, .95).scale(0.05, 0.05, 0.05); // Apply base transformation
  eye1.render();

  let eye2 = new Cube();
  eye2.color = [0.0, 0.0, 0.0, 1.0]; // Black eye
  eye2.matrix = new Matrix4(baseTransform).translate(-0.15, 0.25, 0.95).scale(0.05, 0.05, 0.05); // Apply base transformation
  eye2.render();

    // Wings of the Chicken with the rotation pivot adjusted to where the wing connects to the body
    let wing1 = new Cube();
    wing1.color = [0.82, 0.859, 0.949, 1.0]; // Light grayish color
    wing1.textureNum = 0;
    let wing1Transform = new Matrix4(baseTransform)
      .translate(0.3, -0.35, 0.1) // Move to wing's position
      .translate(0, 0.4, 0) // Move origin to the top of the wing (where it connects to the body)
      .rotate(wingFlapAngle, 0, 0, 1) // Rotate around the new pivot
      .translate(0, -0.4, 0) // Reset pivot to original position
      .scale(0.1, 0.4, 0.6); // Scale the wing
    wing1.matrix = wing1Transform;
    wing1.render();

    let wing2 = new Cube();
    wing2.color = [0.82, 0.859, 0.949, 1.0];
    wing2.textureNum = 0;
    let wing2Transform = new Matrix4(baseTransform)
      .translate(-0.2, -0.35, 0.1) // Move to the opposite wing's position
      .scale(-1, 1, 1) // Flip the wing horizontally across the Y-axis
      .translate(0, 0.4, 0) // Move the pivot to the top of the wing
      .rotate(wingFlapAngle, 0, 0, 1) // Rotate around this pivot
      .translate(0, -0.4, 0) // Undo the pivot translation
      .scale(0.1, 0.4, 0.6); // Scale the wing
    wing2.matrix = wing2Transform;
    wing2.render();

  // Legs of the Chicken with animation, flipped
  let leg1 = new Cube();
  leg1.color = [1, 1, 0.635, 1.0]; // Yellow leg color
  let leg1Transform = new Matrix4(baseTransform)
    .translate(0.1, -0.3, 0.30) // Position at the top of the leg where it connects to the body
    .rotate(180, 1, 0, 0) // Rotate to flip the leg upside down
    .rotate(legMovementAngle, 1, 0, 0) // Apply rotation for walking motion
    .scale(0.1, 0.5, 0.05);
  leg1.matrix = leg1Transform;
  leg1.render();

  let leg2 = new Cube();
  leg2.color = [1, 1, 0.635, 1.0]; // Yellow leg color
  let leg2Transform = new Matrix4(baseTransform)
    .translate(-0.1, -0.3, .30) // Position at the top of the leg where it connects to the body
    .rotate(180, 1, 0, 0) // Rotate to flip the leg upside down
    .rotate(-legMovementAngle, 1, 0, 0) // Apply rotation for walking motion
    .scale(0.1, 0.5, 0.05);
  leg2.matrix = leg2Transform;
  leg2.render();

  // Feet of the Chicken, modified to follow leg transformations without directly referencing leg1Transform or leg2Transform
  let foot1 = new Cube();
  foot1.color = [1, 1, 0.635, 1.0]; // Brown foot
  let foot1Transform = new Matrix4(baseTransform)
    .translate(0.1, -.3, 0.30) // Start with the same base transformation as the leg
    //.rotate(180, 1, 0, 0) // Apply the same flip as the leg
    .rotate(legMovementAngle, 1, 0, 0) // Apply the same walking motion
    .translate(0, -0.5, 0) // Adjust position to the foot location relative to the leg
    .scale(0.1, 0.05, 0.1); // Scale to foot size
  foot1.matrix = foot1Transform;
  foot1.render();

  let foot2 = new Cube();
  foot2.color = [1, 1, 0.635, 1.0]; // Brown foot
  let foot2Transform = new Matrix4(baseTransform)
    .translate(-0.1, -0.3, 0.30) // Start with the same base transformation as the leg
    //.rotate(180, 1, 0, 0) // Apply the same flip as the leg
    .rotate(-legMovementAngle, 1, 0, 0) // Apply the same walking motion, note the opposite angle for the second leg
    .translate(0, -0.5, 0) // Adjust position to the foot location relative to the leg
    .scale(0.1, 0.05, 0.1); // Scale to foot size
  foot2.matrix = foot2Transform;
  foot2.render();

  var duration = performance.now() - startTime; // Calculate duration of rendering
  sendTextToHTML("ms: " + Math.floor(duration) + " fps: " + Math.floor(10000/duration)/10, "numdot"); // Display duration and fps
  }

//Set the text of the HTML element
function sendTextToHTML(text, htmlID){
  var htmlElm = document.getElementById(htmlID); // Get HTML element by ID
  if (!htmlElm){
      console.log("Failed to to get " + htmlID + " from HTML"); // Error handling
      return;
  }
  htmlElm.innerHTML = text; // Set text of HTML element
}
