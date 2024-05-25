// Vertex shader programa
var VSHADER_SOURCE =`
  precision mediump float;
  attribute vec4 a_Position; 
  attribute vec2 a_UV;
  attribute vec3 a_Normal;
  varying vec2 v_UV;
  varying vec3 v_Normal;
  varying vec4 v_VertPos; 
  uniform mat4 u_ModelMatrix;
  uniform mat4 u_ViewMatrix;
  uniform mat4 u_GlobalRotateMatrix;
  uniform mat4 u_ProjectionMatrix;
  void main() {
    gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_GlobalRotateMatrix * u_ModelMatrix * a_Position;
    v_UV = a_UV;
    v_Normal = a_Normal;
    v_VertPos = u_ModelMatrix * a_Position;
  }`

// Fragment shader program
var FSHADER_SOURCE =`
  precision mediump float;
  varying vec2 v_UV;
  varying vec3 v_Normal;
  uniform vec4 u_FragColor;
  uniform sampler2D u_Sampler0;
  uniform sampler2D u_Sampler1;
  uniform sampler2D u_Sampler2;
  uniform int u_whichTexture;
  uniform vec3 u_lightPos;
  uniform vec3 u_lightDir;
  uniform float u_spotlightAngle;
  uniform vec3 u_cameraPos;
  uniform bool u_lightOn; 
  uniform bool u_spotlightOn;  // New uniform for spotlight toggle
  varying vec4 v_VertPos;
  void main() {
    if(u_whichTexture == -3){
      gl_FragColor = vec4((v_Normal+1.0)/2.0, 1.0); //Use normal
    }else if (u_whichTexture == -2){ //use UV debug color
      gl_FragColor = u_FragColor; //use color
    }else if (u_whichTexture == -1){ //use UV debug color
      gl_FragColor = vec4(v_UV,1,1);
    }else if (u_whichTexture == 0){ //use texture0
      gl_FragColor = texture2D(u_Sampler0, v_UV);
    }else if (u_whichTexture == 1){ //use texture1
      gl_FragColor = texture2D(u_Sampler1, v_UV);
    } else if (u_whichTexture == 2){ //use texture2
      gl_FragColor = texture2D(u_Sampler2, v_UV);
    }else{ //error put reddish
      gl_FragColor = vec4(1,.2,.2,1);
    }

    if (u_lightOn) {  // Check if the light is on
      vec3 lightVector = u_lightPos - vec3(v_VertPos);
      float r = length(lightVector);
      vec3 L = normalize(lightVector);
      vec3 N = normalize(v_Normal);
      float nDotL = max(dot(N, L), 0.0);

      // Reflection
      vec3 R = reflect(-L, N);

      // Eye
      vec3 E = normalize(u_cameraPos - vec3(v_VertPos));

      // Specular
      float specular = pow(max(dot(E, R), 0.0), 10.0);

      vec3 diffuse = vec3(gl_FragColor) * nDotL * 0.7;
      vec3 ambient = vec3(gl_FragColor) * 0.3;
      vec4 resultColor = vec4(specular + diffuse + ambient, 1.0);

      if (u_spotlightOn) {  // Apply spotlight effect if enabled
        vec3 spotDirection = normalize(u_lightDir);
        float spotEffect = dot(L, spotDirection);
        if (spotEffect > cos(radians(u_spotlightAngle))) {
          float attenuation = max((spotEffect - cos(radians(u_spotlightAngle))) / (1.0 - cos(radians(u_spotlightAngle))), 0.0);
          gl_FragColor = vec4(resultColor.rgb * attenuation, resultColor.a);
        } else {
          gl_FragColor = vec4(resultColor.rgb * 0.1, resultColor.a);
        }
      } else {
        gl_FragColor = resultColor;
      }
    } else {
      gl_FragColor = vec4(vec3(gl_FragColor) * 0.3, 1.0);  // Only ambient light if light is off
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
let u_Sampler2;
let u_lightPos;
let u_cameraPos;
let u_lightDir;
let u_spotlightAngle;
let u_spotlightOn;

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
let camera; // Declare a camera variable globally

let lightOn = true;

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
  u_lightDir = gl.getUniformLocation(gl.program, 'u_lightDir');
  if (!u_lightDir) {
    console.log('Failed to get the storage location of u_lightDir');
    return;
  }
  u_spotlightAngle = gl.getUniformLocation(gl.program, 'u_spotlightAngle');
  if (!u_spotlightAngle) {
    console.log('Failed to get the storage location of u_spotlightAngle');
    return;
  }

  u_spotlightOn = gl.getUniformLocation(gl.program, 'u_spotlightOn');
  if (!u_spotlightOn) {
    console.log('Failed to get the storage location of u_spotlightOn');
    return;
  }

  gl.uniform3f(u_lightDir, 0.0, 1.0, 0.0);  
  gl.uniform1f(u_spotlightAngle, 15.0);  
  gl.uniform1i(u_spotlightOn, false);  // Initially off

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

  a_Normal = gl.getAttribLocation(gl.program, 'a_Normal');
  if (a_Normal < 0) {
    console.log('Failed to get the storage location of a_Normal');
    return;
  }

  // Get the storage location of u_FragColor
  u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
  if (!u_FragColor) {
    console.log('Failed to get the storage location of u_FragColor');
    return;
  }

  // Get the storage location of u_FragColor
  u_lightPos = gl.getUniformLocation(gl.program, 'u_lightPos');
  if (!u_lightPos) {
    console.log('Failed to get the storage location of u_lightPos');
    return;
  }

  // Get the storage location of u_FragColor
  u_cameraPos = gl.getUniformLocation(gl.program, 'u_cameraPos');
  if (!u_cameraPos) {
    console.log('Failed to get the storage location of u_cameraPos');
    return;
  }  

  // Get the storage location of u_lightOn
  u_lightOn = gl.getUniformLocation(gl.program, 'u_lightOn');
  if (!u_lightOn) {
    console.log('Failed to get the storage location of u_lightOn');
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

  u_Sampler2 = gl.getUniformLocation(gl.program, 'u_Sampler2');
  if (!u_Sampler2){
    console.log('Failed to get the storage location of u_Sampler2');
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
let lightAnimation = true;

let wingAnimation = false;
let beakAnimation = false;
let legAnimation = false;
let wattleAnimation = false;
let feetAnimation = false;
let g_normalOn = false;
let spotlightOn = false;
let g_lightPos = [0,1,-2];


// Set up actions for the HTML UI elements
// Set up HTML UI element interactions
function addActionsForHtmlUI(){
  // Existing slider and button actions

  document.getElementById('lightSlideX').addEventListener('mousemove', function(ev) {if (ev.buttons == 1){ g_lightPos[0] = this.value/100; renderAllShapes();}});
  document.getElementById('lightSlideY').addEventListener('mousemove', function(ev) {if (ev.buttons == 1){ g_lightPos[1] = this.value/100; renderAllShapes();}});
  document.getElementById('lightSlideZ').addEventListener('mousemove', function(ev) {if (ev.buttons == 1){ g_lightPos[2] = this.value/100; renderAllShapes();}});

  document.getElementById('xAxisSlide').addEventListener('input', function() {
    g_xMRotation = parseInt(this.value);
    updateGlobalRotationMatrix();
  });

  document.getElementById('yAxisSlide').addEventListener('input', function() {
    g_yMRotation = parseInt(this.value);
    updateGlobalRotationMatrix();
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

  document.getElementById('normalOn').onclick = function() {g_normalOn = true;};
  document.getElementById('normalOff').onclick = function() {g_normalOn = false;};

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

  document.getElementById('toggleLightAnimationButton').onclick = function() {
    // Toggle the light animation state
    lightAnimation = !lightAnimation;

    if (!lightAnimation) {
      // Reset light position to default values
      g_lightPos = [0, 1, -2];
    }

    renderAllShapes(); // Re-render to update the light position
  };

  document.getElementById('toggleLightButton').onclick = function() {
    // Toggle the light 
    lightOn = !lightOn;
    renderAllShapes(); 
  };

  document.getElementById('toggleSpotlightButton').onclick = function() {
    spotlightOn = !spotlightOn;
    gl.uniform1i(u_spotlightOn, spotlightOn);
    renderAllShapes();  // Re-render to apply changes
  };
}



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
  }else if (textureId === 2){}
    gl.uniform1i(u_Sampler2, 2);
}

function updateWebGL() {
  gl.uniformMatrix4fv(u_ViewMatrix, false, camera.viewMatrix.elements);
  renderAllShapes(); // Update the scene rendering
}

function handleKeyDown(ev) {
  switch (ev.keyCode) {
      case 87: // W key
          camera.moveForward(0.1);
          break;
      case 83: // S key
          camera.moveBackward(0.1);
          break;
      case 65: // A key
          camera.moveLeft(0.1);
          break;
      case 68: // D key
          camera.moveRight(0.1);
          break;
      case 81: // Q key
          camera.panLeft(5); // Rotate left, angle in degrees
          break;
      case 69: // E key
          camera.panRight(5); // Rotate right, angle in degrees
          break;
      default:
          return; // Skip rendering if no relevant key is pressed
  }
  updateWebGL();
}

let walls = []; // Global variable for storing walls
// Define a 2D array representing the map
var map = [
  //[2, 2, 2, 2],
  //[2, 2, 2, 2],
  //[2, 0, 0, 2],
  //[2, 2, 2, 2]
];

function createWallsFromMap() {
  let walls = [];
  // Define the scale for the wall cubes here
  let scaleX = 0.5;  // Smaller width of each wall cube
  let scaleY = 1;    // Keep the original height for demonstration
  let scaleZ = 0.5;  // Smaller depth of each wall cube

  // Double loop to process each cell in the 2D array
  for (let x = 0; x < map.length; x++) {
      for (let z = 0; z < map[x].length; z++) {
          let height = map[x][z];  // Get the height from the map
          if (height > 0) {  // Check if we need to place a wall
              for (let y = 0; y < height; y++) {  // Iterate over the height
                  let w = new Cube();  // Create a new cube
                  // Set the position of the cube
                  // Adjust the position to account for smaller cube size
                  w.matrix.translate(x * scaleX, y * scaleY, z * scaleZ);
                  // Set the size of the cube
                  w.matrix.scale(scaleX, scaleY, scaleZ);
                  walls.push(w);  // Add the cube to the walls array
              }
          }
      }
  }
  return walls;
}

function main() {
    // set up canvas and gl variables 
    setupWebGL();
    //Set up GLSL shader programs and connect GLSL variables
    connectVariablesToGLSL();

    //Set up actions for the HTML UI elements
    addActionsForHtmlUI();

    camera = new Camera(canvas); 

    //drawMap();

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

    
  

    initTextures(gl, 0, 'sky1.jpg');
    initTextures(gl, 1, 'body.jpg'); 
    initTextures(gl, 2, 'walls.jpg'); 


  // Specify the color for clearing <canvas>
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  document.onkeydown = function(ev) {
    handleKeyDown(ev);
};

walls = createWallsFromMap();
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
  let lightRadius = 8.0;
  let lightSpeed = 0.5;

  if (lightAnimation) {
    // Update light position to animate across a larger area
    g_lightPos[0] = lightRadius * Math.cos(g_seconds * lightSpeed);
    g_lightPos[2] = lightRadius * Math.sin(g_seconds * lightSpeed);
  }


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
  camera.projectionMatrix.setPerspective(camera.fov, canvas.width / canvas.height, 0.1, 1000);
  gl.uniformMatrix4fv(u_ProjectionMatrix, false, camera.projectionMatrix.elements);

  //Pass the view Matrix
  gl.uniformMatrix4fv(u_ViewMatrix, false, camera.viewMatrix.elements);

  let globalRotMat = new Matrix4().rotate(g_xMRotation, 1, 0, 0).rotate(g_yMRotation, 0, 1, 0); // Create global rotation matrix
  gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMat.elements);  

  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.clear(gl.COLOR_BUFFER_BIT );

  // Pass the light position and state
  gl.uniform3f(u_lightPos, g_lightPos[0], g_lightPos[1], g_lightPos[2]);
  gl.uniform1i(u_lightOn, lightOn);  // Pass the light state

  // Pass the camera position
  gl.uniform3f(u_cameraPos, camera.eye.elements[0], camera.eye.elements[1], camera.eye.elements[2]);

  // Draw the light 
  if (lightOn) {
    var light = new Cube();
    light.color = [2,2,0,1];
    light.matrix.translate(g_lightPos[0], g_lightPos[1], g_lightPos[2]);
    light.matrix.scale(1,1,1);
    light.matrix.translate(-.5, 15, -.5);
    light.render();
  }

  // Render each wall
  walls.forEach(wall => wall.render()); // Render walls stored in the global array
  
  //Base transformation for the whole chicken: smaller scale and flipped
  let baseTransform = new Matrix4().scale(8, 8, 8 ); 
  baseTransform.rotate(340, 0, 1, 0); // Rotate 180 degrees to flip the chicken
  baseTransform.translate(0, -.15, 0);

  var sphereObj = new Sphere();
  sphereObj.color = [0, 0.8, 0.8, 1];
  if (g_normalOn) sphereObj.textureNum = -3;
  
  // Move the sphere 
  sphereObj.setPosition(10, 0, -5.0);
  
  // Scale the sphere 
  sphereObj.setScale(8, 8, 8);
  
  sphereObj.render();


  //sky 
  var skybox = new Cube();
  skybox.color = [0.5,0.5,0.5,1];
  if (g_normalOn) skybox.textureNum = -3;
  //skybox.textureNum = 0; // Assuming texture unit 0 has the sky texture
  skybox.matrix.scale(-50, -50, -50); // Adjust size as needed
  skybox.matrix.translate(-0.5, -0.5, -0.5); // Center the cube
  skybox.render();
  
  //Floor
  var floor = new Cube();
  floor.textureNum = 2;
  floor.color = [0.0,1.0,0.0,1.0];
  floor.matrix.translate(0,-8,0.0);
  floor.matrix.scale(100,0.5,100);
  floor.matrix.translate(-.5,0,-0.5);
  floor.render();

  // Body of the Chicken
  let body = new Cube();
  if (g_normalOn) body.textureNum = -3;
  //body.textureNum = 1;
  body.color = [0.961,1,1,1.00]; // White body
  body.matrix = new Matrix4(baseTransform).translate(-.20, -0.4, 0.0).scale(0.5, 0.5, 0.8); // Apply base transformation
  body.render();

  // Head of the Chicken
  let head = new Cube();
  if (g_normalOn) head.textureNum = -3;
  //head.textureNum = 1;
  head.color = [0.961,1,1,1.00]; // White head
  head.matrix = new Matrix4(baseTransform).translate(-.15, -0.1, .70).scale(0.40, 0.5, 0.25); // Apply base transformation
  head.render();

  // Top of Beak of the Chicken
  let beak = new Cube();
  //if (g_normalOn) beak.textureNum = -3;
  beak.color = [.804,.655,.38, 1.0]; // Orange beak
  beak.matrix = new Matrix4(baseTransform).translate(-0.15, 0.2, .95).scale(0.40, 0.05, 0.1); // Apply base transformation
  beak.render();

  // Render bottom part of the beak with animation
  let beak2 = new Cube();
  //if (g_normalOn) beak2.textureNum = -3;
  beak2.color = [0.639, 0.514, 0.298, 1.0];
  beak2.matrix = new Matrix4(baseTransform)
    .translate(-0.15, 0.15, 0.95)
    .rotate(beakMovementAngle, 1, 0, 0) // Apply rotation for opening/closing motion from slider
    .scale(0.40, 0.05, 0.1);
  beak2.render();

// Render wattle with the same animation as the bottom part of the beak
let wattle = new Cube();
//if (g_normalOn) wattle.textureNum = -3;
wattle.color = [.769, 0.129, 0.153, 1.0];
let wattleTransform = new Matrix4(baseTransform)
  .translate(0.00, 0.05, 0.95) // Adjust the position according to your model's structure
  .rotate(beakMovementAngle, 1, 0, 0) // Synchronize the rotation with the bottom beak
  .scale(0.10, 0.1, 0.1);
wattle.matrix = wattleTransform;
wattle.render();

  // Eyes of the Chicken
  let eye1 = new Cube();
  //if (g_normalOn) eye1.textureNum = -3;
  eye1.color = [0.0, 0.0, 0.0, 1.0]; // Black eye
  eye1.matrix = new Matrix4(baseTransform).translate(0.2, 0.25, .95).scale(0.05, 0.05, 0.05); // Apply base transformation
  eye1.render();

  let eye2 = new Cube();
  //if (g_normalOn) eye2.textureNum = -3;
  eye2.color = [0.0, 0.0, 0.0, 1.0]; // Black eye
  eye2.matrix = new Matrix4(baseTransform).translate(-0.15, 0.25, 0.95).scale(0.05, 0.05, 0.05); // Apply base transformation
  eye2.render();

  // Legs of the Chicken with animation, flipped
  let leg1 = new Cube();
  if (g_normalOn) leg1.textureNum = -3;
  leg1.color = [1, 1, 0.635, 1.0]; // Yellow leg color
  let leg1Transform = new Matrix4(baseTransform)
    .translate(0.1, -0.3, 0.30) // Position at the top of the leg where it connects to the body
    .rotate(180, 1, 0, 0) // Rotate to flip the leg upside down
    .rotate(legMovementAngle, 1, 0, 0) // Apply rotation for walking motion
    .scale(0.1, 0.5, 0.05);
  leg1.matrix = leg1Transform;
  leg1.render();

  let leg2 = new Cube();
  if (g_normalOn) leg2.textureNum = -3;
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
  if (g_normalOn) foot1.textureNum = -3;
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
  if (g_normalOn) foot2.textureNum = -3;
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