// Vertex shader source code
var VSHADER_SOURCE =`
  attribute vec4 a_Position; // Position variable for vertex
  uniform mat4 u_ModelMatrix; // Model matrix for transformations
  uniform mat4 u_GlobalRotateMatrix; // Global rotation matrix
  void main() {
    gl_Position = u_GlobalRotateMatrix * u_ModelMatrix * a_Position; // Calculate final position
  }`

// Fragment shader source code
var FSHADER_SOURCE =`
  precision mediump float; // Set precision for floating points
  uniform vec4 u_FragColor; // Fragment color uniform
  void main() {
    gl_FragColor = u_FragColor; // Set the color of a pixel
  }`

// Global variables
let canvas; // HTML canvas element
let gl; // WebGL rendering context
let a_Position; // Location of vertex position attribute
let u_FragColor; // Location of fragment color uniform
let u_ModelMatrix; // Location of model matrix uniform
let u_GlobalRotateMatrix; // Location of global rotation matrix uniform

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
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to initialize shaders'); // Error handling
    return;
  }
  a_Position = gl.getAttribLocation(gl.program, 'a_Position'); // Get location of vertex position attribute
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position'); // Error handling
    return;
  }
  u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor'); // Get location of fragment color uniform
  if (!u_FragColor) {
    console.log('Failed to get the storage location of u_FragColor'); // Error handling
    return;
  }
  u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix'); // Get location of model matrix uniform
  if (!u_ModelMatrix) {
    console.log('Failed to get the storage location of u_ModelMatrix'); // Error handling
    return;
  }
  u_GlobalRotateMatrix = gl.getUniformLocation(gl.program, 'u_GlobalRotateMatrix'); // Get location of global rotation matrix uniform
  if (!u_GlobalRotateMatrix) {
    console.log('Failed to get the storage location of u_GlobalRotateMatrix'); // Error handling
    return;
  }
  var identityM = new Matrix4(); // Create identity matrix
  gl.uniformMatrix4fv(u_ModelMatrix, false, identityM.elements); // Set model matrix to identity

  updateGlobalRotationMatrix();
}

// Constants for object types
const POINT = 0; // Constant for point type
const TRIANGLE = 1; // Constant for triangle type
const CIRCLE = 2; // Constant for circle type

// Global variables related to UI elements
let g_selectedColor = [1.0,1.0,1.0,1.0]; // Default white color
let g_selectedSize = 5; // Default size
let g_selectedType= POINT; // Default selected type
let g_globalAngle=0; // Global rotation angle for all shapes
let g_yellowAngle = 0; // Specific rotation angle for yellow object
let g_magentaAngle = 0; // Specific rotation angle for magenta object
let g_yellowAnimation = false; // Flag for yellow object animation
let g_magentaAnimation = false; // Flag for magenta object animation

let wingAnimation = false;
let beakAnimation = false;
let legAnimation = false;
let wattleAnimation = false;
let feetAnimation = false;

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

function updateGlobalRotationMatrix() {
  let xRad = g_xMRotation * Math.PI / 180;
  let yRad = g_yMRotation * Math.PI / 180;
  
  // Create a new rotation matrix from X and Y rotations only
  let globalRotMat = new Matrix4().rotate(xRad, 1, 0, 0)  // Rotation around X-axis
                                   .rotate(yRad, 0, 1, 0); // Rotation around Y-axis
  gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMat.elements);
}

function main() {
  setupWebGL(); // Set up WebGL context and shaders
  connectVariablesToGLSL(); // Connect shader variables
  addActionsForHtmlUI(); // Set up UI interactions
  

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
  gl.clearColor(0.3, 0.5, 0.2, 1.0); // Set clear color for canvas

  requestAnimationFrame(tick); // Start the rendering loop
}

function rotateModel(deltaX, deltaY) {
  g_xMRotation -= deltaY / 100 * 100; // Update global X rotation based on deltaY
  g_yMRotation -= deltaX / 100 * 100; // Update global Y rotation based on deltaX
  renderAllShapes(); // Redraw all shapes
}

var g_startTime = performance.now()/1000.0; // Store start time in seconds
var g_seconds = performance.now()/1000.0-g_startTime // Calculate elapsed time in seconds

function tick(){
  g_seconds = performance.now()/1000.0-g_startTime; // Update elapsed time
  console.log(g_seconds); // Log elapsed time

  updateAnimationAngles(); // Update angles for animated objects

  renderAllShapes(); // Redraw all shapes

  requestAnimationFrame(tick); // Request the next frame for animation
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

var g_shapesList = []; // List of all shapes to be rendered

function click(ev) {
  [x,y] = convertCoordinatesEventToGl(ev); // Convert click coordinates to WebGL system

  let point;
  if(g_selectedType == POINT){
    point = new Point(); // Create new point object
  }else if (g_selectedType == TRIANGLE){
    point = new Triangle(); // Create new triangle object
  } else if (g_selectedType === CIRCLE) {
    let segments = parseInt(document.getElementById('segmentSlide').value); // Get segments value from slider
    point = new Circle(segments); // Create new circle object
  }

  point.position=[x,y]; // Set position for the shape
  point.color=g_selectedColor.slice(); // Copy selected color
  point.size=g_selectedSize; // Set size of the shape
  g_shapesList.push(point); // Add new shape to the list

  renderAllShapes(); // Render all shapes
}

// Convert event coordinates to WebGL coordinates
function convertCoordinatesEventToGl(ev){
  var x = ev.clientX; // X coordinate of the mouse event
  var y = ev.clientY; // Y coordinate of the mouse event
  var rect = ev.target.getBoundingClientRect(); // Get bounding rectangle of canvas

  x = ((x - rect.left) - canvas.width/2)/(canvas.width/2); // Convert x to WebGL coordinate system
  y = (canvas.height/2 - (y - rect.top))/(canvas.height/2); // Convert y to WebGL coordinate system

  return([x,y]); // Return converted coordinates
}

function renderAllShapes(){
  var startTime = performance.now(); // Start time for rendering

  let globalRotMat = new Matrix4().rotate(g_xMRotation, 1, 0, 0).rotate(g_yMRotation, 0, 1, 0); // Create global rotation matrix
  gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMat.elements); // Set global rotation matrix in shader

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); // Clear the canvas

  // Base transformation for the whole chicken: smaller scale and flipped
  let baseTransform = new Matrix4().scale(0.7, 0.7, 0.7); // Scale down to 50%
  baseTransform.rotate(240, 0, 1, 0); // Rotate 180 degrees to flip the chicken

  // Body of the Chicken
  let body = new Cube();
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

// Update HTML element with text
function sendTextToHTML(text, htmlID){
  var htmlElm = document.getElementById(htmlID); // Get HTML element by ID
  if (!htmlElm){
      console.log("Failed to to get " + htmlID + " from HTML"); // Error handling
      return;
  }
  htmlElm.innerHTML = text; // Set text of HTML element
}