var VSHADER_SOURCE = `
  precision mediump float;
  attribute vec4 a_Position; 
  attribute vec2 a_UV;
  varying vec2 v_UV;
  uniform mat4 u_ModelMatrix, u_ViewMatrix, u_GlobalRotateMatrix, u_ProjectionMatrix;
  void main() {
    gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_GlobalRotateMatrix * u_ModelMatrix * a_Position;
    v_UV = a_UV;
  }`;

var FSHADER_SOURCE = `
  precision mediump float;
  varying vec2 v_UV;
  uniform vec4 u_FragColor;
  uniform sampler2D u_Sampler0, u_Sampler1, u_Sampler2, u_Sampler3;
  uniform int u_whichTexture;
  void main() {
    if (u_whichTexture == -2) gl_FragColor = u_FragColor;
    else if (u_whichTexture == -1) gl_FragColor = vec4(v_UV, 1, 1);
    else if (u_whichTexture == 0) gl_FragColor = texture2D(u_Sampler0, v_UV);
    else if (u_whichTexture == 1) gl_FragColor = texture2D(u_Sampler1, v_UV);
    else if (u_whichTexture == 2) gl_FragColor = texture2D(u_Sampler2, v_UV);
    else if (u_whichTexture == 3) gl_FragColor = texture2D(u_Sampler3, v_UV);
    else gl_FragColor = vec4(1, 0.2, 0.2, 1); // Error case
  }`;

// Global Variables
let canvas, gl;
let a_Position, a_UV;
let u_FragColor, u_ModelMatrix, u_ProjectionMatrix, u_ViewMatrix, u_GlobalRotateMatrix, u_Sampler0, u_Sampler1, u_Sampler2, u_Sampler3, u_whichTexture;
let g_xMRotation = 0, g_yMRotation = 0, g_zMRotation = 0;
let wingFlapAngle = 0, wingFlapDirection = 1;
let beakMovementAngle = 0, beakDirection = 1, beakMaxRotation = 10;
let legMovementAngle = 0, legDirection = 1, legMaxRotation = 20;
let wattleDirection = 1, wattleAngle = 0;
let feetDirection = 1, feetAngle = 0;
let camera;

function setupWebGL() {
  canvas = document.getElementById('webgl');
  gl = canvas.getContext("webgl", { preserveDrawingBuffer: true, depth: true });
  if (!gl) {
    console.error('Failed to get the rendering context for WebGL');
    return;
  }
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);
  gl.disable(gl.BLEND);
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.error('Failed to initialize shaders');
    return;
  }
}

function getUniformLocation(program, name) {
  const location = gl.getUniformLocation(program, name);
  if (!location) {
    console.error(`Failed to get the storage location of ${name}`);
    return null;
  }
  return location;
}

function connectVariablesToGLSL() {
  a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  a_UV = gl.getAttribLocation(gl.program, 'a_UV');
  u_FragColor = getUniformLocation(gl.program, 'u_FragColor');
  u_ModelMatrix = getUniformLocation(gl.program, 'u_ModelMatrix');
  u_GlobalRotateMatrix = getUniformLocation(gl.program, 'u_GlobalRotateMatrix');
  u_ViewMatrix = getUniformLocation(gl.program, 'u_ViewMatrix');
  u_ProjectionMatrix = getUniformLocation(gl.program, 'u_ProjectionMatrix');
  u_Sampler0 = getUniformLocation(gl.program, 'u_Sampler0');
  u_Sampler1 = getUniformLocation(gl.program, 'u_Sampler1');
  u_Sampler2 = getUniformLocation(gl.program, 'u_Sampler2');
  u_Sampler3 = getUniformLocation(gl.program, 'u_Sampler3');
  u_whichTexture = getUniformLocation(gl.program, 'u_whichTexture');
  updateGlobalRotationMatrix(); // Initialize rotation matrix after connecting variables
}

const POINT = 0;
const TRIANGLE = 1;
const CIRCLE = 2;

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

function addActionsForHtmlUI(){
  document.getElementById('xAxisSlide').addEventListener('input', function() {
    g_xMRotation = parseInt(this.value);
    updateGlobalRotationMatrix();
  });

  document.getElementById('yAxisSlide').addEventListener('input', function() {
    g_yMRotation = parseInt(this.value);
    updateGlobalRotationMatrix();
  });

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
    g_xMRotation = 0;
    g_yMRotation = 0;
    wingFlapAngle = 0;
    beakMovementAngle = 0;
    legMovementAngle = 0;
    wattleAngle = 0;
    feetAngle = 0;
    
    document.getElementById('xAxisSlide').value = 0;
    document.getElementById('yAxisSlide').value = 0;
    document.getElementById('wingFlapSlide').value = 0;
    document.getElementById('beakMovementSlide').value = 0;
    document.getElementById('legMovementSlide').value = 0;
    document.getElementById('wattleTiltSlide').value = 0;
    document.getElementById('feetTiltSlide').value = 0;
    
    renderAllShapes();
  };

  document.getElementById('toggleAllAnimationsButton').onclick = function() {
    let animationsAreOn = wingAnimation || beakAnimation || legAnimation || wattleAnimation || feetAnimation;
    wingAnimation = !animationsAreOn;
    beakAnimation = !animationsAreOn;
    legAnimation = !animationsAreOn;
    wattleAnimation = !animationsAreOn;
    feetAnimation = !animationsAreOn;
    
    this.textContent = animationsAreOn ? "Turn All Animations On" : "Turn All Animations Off";
  };
}

function initTextures(gl, textureId, imageUrl) {
  var image = new Image();
  image.onload = function() {
    loadTexture(gl, textureId, image);
  };
  image.src = imageUrl;
}

function updateGlobalRotationMatrix() {
  const xRad = g_xMRotation * Math.PI / 180;
  const yRad = g_yMRotation * Math.PI / 180;
  let globalRotMat = new Matrix4().rotate(xRad, 1, 0, 0).rotate(yRad, 0, 1, 0);
  gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMat.elements);
}

function loadTexture(gl, textureId, image) {
  var texture = gl.createTexture();
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
  gl.activeTexture(gl.TEXTURE0 + textureId);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
  
  if (textureId === 0) {
    gl.uniform1i(u_Sampler0, 0);
  } else if (textureId === 1) {
    gl.uniform1i(u_Sampler1, 1);
  } else if (textureId === 2) {
    gl.uniform1i(u_Sampler2, 2);
  }else if (textureId === 3) {
    gl.uniform1i(u_Sampler3, 3);
}
}

function updateWebGL() {
  gl.uniformMatrix4fv(u_ViewMatrix, false, camera.viewMatrix.elements);
  renderAllShapes();
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
        camera.panLeft(5);
        break;
    case 69: // E key
        camera.panRight(5);
        break;
    default:
        return; // Skip rendering if no relevant key is pressed
  }
  updateWebGL();
}

// Global variable for the map
var g_map = [];

// Function to initialize a larger map
function initializeMap() {
  const size = 10;  // Define the size of the map
  g_map = new Array(size).fill(0).map(() => new Array(size).fill(1));  // Initialize all walls

  // Create the maze using DFS starting from the top-left corner
  let stack = [[0, 0]];
  g_map[0][0] = 0;  // Start point

  while (stack.length > 0) {
    let [x, y] = stack.pop();
    let directions = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    directions = directions.sort(() => Math.random() - 0.5);  // Shuffle directions

    for (let [dx, dy] of directions) {
      let nx = x + 2 * dx, ny = y + 2 * dy;
      if (nx >= 0 && nx < size && ny >= 0 && ny < size && g_map[nx][ny] === 1) {
        g_map[nx][ny] = 0;  // Carve path
        g_map[x + dx][y + dy] = 0;  // Carve path
        stack.push([nx, ny]);
      }
    }
  }
}

function drawMap() {
  console.log("Drawing map with size:", g_map.length);
  const wallHeight = 4;  // Set the height of the walls
  for (let x = 0; x < g_map.length; x++) {
    for (let z = 0; z < g_map[x].length; z++) {
      if (g_map[x][z] === 1) {  // Check if it's a wall
        for (let y = 0; y < wallHeight; y++) {  // Stack cubes to create the wall
          var body = new Cube();
          body.textureNum = 3;
          body.color = [1.0, 1.0, 1.0, 1.0];  // Wall color
          body.matrix.translate(x - g_map.length / 2, y, z - g_map[x].length / 2);  // Center the map and stack cubes vertically
          body.render();
        }
      }
    }
  }
}





function main() {
    setupWebGL();
    connectVariablesToGLSL();
    addActionsForHtmlUI();
    initializeMap();

    camera = new Camera(canvas);

    let isDragging = false;
    let lastMouseX = -1, lastMouseY = -1;

    canvas.onmousedown = function(ev) {
      isDragging = true;
      [lastMouseX, lastMouseY] = [ev.clientX, ev.clientY];
    };

    canvas.onmouseup = function(ev) {
      isDragging = false;
    };

    canvas.onmousemove = function(ev) {
      if (isDragging) {
        let [currentX, currentY] = [ev.clientX, ev.clientY];
        let deltaX = currentX - lastMouseX;
        let deltaY = currentY - lastMouseY;
        rotateModel(deltaX, deltaY);
        [lastMouseX, lastMouseY] = [currentX, currentY];
      }
    };

    initTextures(gl, 0, 'sky1.jpg');
    initTextures(gl, 1, 'body.jpg');
    initTextures(gl, 2, 'grass.jpg');
    initTextures(gl, 3, 'walls.jpg');

  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  document.onkeydown = function(ev) {
    handleKeyDown(ev);
};

requestAnimationFrame(tick);

}

function rotateModel(deltaX, deltaY) {
  g_xMRotation -= deltaY / 100 * 100;
  g_yMRotation -= deltaX / 100 * 100;
  renderAllShapes();
}

var g_startTime = performance.now()/1000.0;
var g_seconds = performance.now()/1000.0-g_startTime

function tick(){

  g_seconds = performance.now()/1000.0-g_startTime;

  updateAnimationAngles();

  renderAllShapes();

  requestAnimationFrame(tick);
}

function updateAnimationAngles() {
  if (wingAnimation) {
    wingFlapAngle += wingFlapDirection * 2;
    if (wingFlapAngle > 50 || wingFlapAngle < 0) {
      wingFlapDirection *= -1;
    }
  }

  if (beakAnimation) {
    beakMovementAngle += beakDirection * 0.5;
    if (beakMovementAngle > beakMaxRotation || beakMovementAngle < 0) {
      beakDirection *= -1;
    }
  }

  if (legAnimation) {
    legMovementAngle += legDirection * 1;
    if (legMovementAngle > legMaxRotation || legMovementAngle < -legMaxRotation) {
      legDirection *= -1;
    }
  }

  if (wattleAnimation) {
    wattleAngle += wattleDirection * 0.7;
    if (wattleAngle > 10 || wattleAngle < -10) {
      wattleDirection *= -1;
    }
  }

  if (feetAnimation) {
    feetAngle += feetDirection * 0.7;
    if (feetAngle > 20 || feetAngle < -20) {
      feetDirection *= -1;
    }
  }
}

var g_shapesList = [];

function click(ev) {

  [x,y] = convertCoordinatesEventToGl(ev);

  let point;
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

  renderAllShapes();

}

function convertCoordinatesEventToGl(ev){
    var x = ev.clientX;
    var y = ev.clientY;
    var rect = ev.target.getBoundingClientRect();

    x = ((x - rect.left) - canvas.width/2)/(canvas.width/2);
    y = (canvas.height/2 - (y - rect.top))/(canvas.height/2);

    return([x,y]);
}

function renderAllShapes(){

  var startTime = performance.now();

  camera.projectionMatrix.setPerspective(camera.fov, canvas.width / canvas.height, 0.1, 1000);
  gl.uniformMatrix4fv(u_ProjectionMatrix, false, camera.projectionMatrix.elements);

  gl.uniformMatrix4fv(u_ViewMatrix, false, camera.viewMatrix.elements);

  let globalRotMat = new Matrix4().rotate(g_xMRotation, 1, 0, 0).rotate(g_yMRotation, 0, 1, 0);
  gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMat.elements);  

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.clear(gl.COLOR_BUFFER_BIT );

  drawMap();

  let baseTransform = new Matrix4().scale(2, 2, 2 ); 
  baseTransform.rotate(330, 0, 1, 0);
  baseTransform.translate(-5, 0.80, 0);

  var skybox = new Cube();
  skybox.color = [1,0,0,1];
  skybox.textureNum = 0;
  skybox.matrix.scale(50, 50, 50);
  skybox.matrix.translate(-0.5, -0.5, -0.5);
  skybox.render();

  var floor = new Cube();
  floor.textureNum = 2;
  floor.color = [0.0,1.0,0.0,1.0];
  floor.matrix.translate(0,-0.55,0.0);
  floor.matrix.scale(100,0.5,100);
  floor.matrix.translate(-.5,0,-0.5);
  floor.render();

  let body = new Cube();
  body.textureNum = 1;
  body.color = [0.961,1,1,1.00];
  body.matrix = new Matrix4(baseTransform).translate(-.20, -0.4, 0.0).scale(0.5, 0.5, 0.8);
  body.render();

  let head = new Cube();
  head.textureNum = 1;
  head.color = [0.961,1,1,1.00];
  head.matrix = new Matrix4(baseTransform).translate(-.15, -0.1, .70).scale(0.40, 0.5, 0.25);
  head.render();

  let beak = new Cube();
  beak.color = [.804,.655,.38, 1.0];
  beak.matrix = new Matrix4(baseTransform).translate(-0.15, 0.2, .95).scale(0.40, 0.05, 0.1);
  beak.render();

  let beak2 = new Cube();
  beak2.color = [0.639, 0.514, 0.298, 1.0];
  beak2.matrix = new Matrix4(baseTransform)
    .translate(-0.15, 0.15, 0.95)
    .rotate(beakMovementAngle, 1, 0, 0)
    .scale(0.40, 0.05, 0.1);
  beak2.render();

let wattle = new Cube();
wattle.color = [.769, 0.129, 0.153, 1.0];
let wattleTransform = new Matrix4(baseTransform)
  .translate(0.00, 0.05, 0.95)
  .rotate(beakMovementAngle, 1, 0, 0)
  .scale(0.10, 0.1, 0.1);
wattle.matrix = wattleTransform;
wattle.render();

  let eye1 = new Cube();
  eye1.color = [0.0, 0.0, 0.0, 1.0];
  eye1.matrix = new Matrix4(baseTransform).translate(0.2, 0.25, .95).scale(0.05, 0.05, 0.05);
  eye1.render();

  let eye2 = new Cube();
  eye2.color = [0.0, 0.0, 0.0, 1.0];
  eye2.matrix = new Matrix4(baseTransform).translate(-0.15, 0.25, 0.95).scale(0.05, 0.05, 0.05);
  eye2.render();

    let wing1 = new Cube();
    wing1.color = [0.82, 0.859, 0.949, 1.0];
    wing1.textureNum = 1;
    let wing1Transform = new Matrix4(baseTransform)
      .translate(0.3, -0.35, 0.1)
      .translate(0, 0.4, 0)
      .rotate(wingFlapAngle, 0, 0, 1)
      .translate(0, -0.4, 0)
      .scale(0.1, 0.4, 0.6);
    wing1.matrix = wing1Transform;
    wing1.render();

    let wing2 = new Cube();
    wing2.color = [0.82, 0.859, 0.949, 1.0];
    wing2.textureNum = 1;
    let wing2Transform = new Matrix4(baseTransform)
      .translate(-0.2, -0.35, 0.1)
      .scale(-1, 1, 1)
      .translate(0, 0.4, 0)
      .rotate(wingFlapAngle, 0, 0, 1)
      .translate(0, -0.4, 0)
      .scale(0.1, 0.4, 0.6);
    wing2.matrix = wing2Transform;
    wing2.render();

  let leg1 = new Cube();
  leg1.color = [1, 1, 0.635, 1.0];
  let leg1Transform = new Matrix4(baseTransform)
    .translate(0.1, -0.3, 0.30)
    .rotate(180, 1, 0, 0)
    .rotate(legMovementAngle, 1, 0, 0)
    .scale(0.1, 0.5, 0.05);
  leg1.matrix = leg1Transform;
  leg1.render();

  let leg2 = new Cube();
  leg2.color = [1, 1, 0.635, 1.0];
  let leg2Transform = new Matrix4(baseTransform)
    .translate(-0.1, -0.3, .30)
    .rotate(180, 1, 0, 0)
    .rotate(-legMovementAngle, 1, 0, 0)
    .scale(0.1, 0.5, 0.05);
  leg2.matrix = leg2Transform;
  leg2.render();

  let foot1 = new Cube();
  foot1.color = [1, 1, 0.635, 1.0];
  let foot1Transform = new Matrix4(baseTransform)
    .translate(0.1, -.3, 0.30)
    .rotate(legMovementAngle, 1, 0, 0)
    .translate(0, -0.5, 0)
    .scale(0.1, 0.05, 0.1);
  foot1.matrix = foot1Transform;
  foot1.render();

  let foot2 = new Cube();
  foot2.color = [1, 1, 0.635, 1.0];
  let foot2Transform = new Matrix4(baseTransform)
    .translate(-0.1, -0.3, 0.30)
    .rotate(-legMovementAngle, 1, 0, 0)
    .translate(0, -0.5, 0)
    .scale(0.1, 0.05, 0.1);
  foot2.matrix = foot2Transform;
  foot2.render();

  var duration = performance.now() - startTime;
  sendTextToHTML("ms: " + Math.floor(duration) + " fps: " + Math.floor(10000/duration)/10, "numdot");
}

function sendTextToHTML(text, htmlID){
  var htmlElm = document.getElementById(htmlID);
  if (!htmlElm){
      console.log("Failed to to get " + htmlID + " from HTML");
      return;
  }
  htmlElm.innerHTML = text;
}