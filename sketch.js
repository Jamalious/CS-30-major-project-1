/**
 * Made with p5play!
 * https://p5play.org
 */

// Paper.io lite
// John Asiamah
// Date
//
// Extra for Experts:
// - describe what you did to take this project "above and beyond"
// sprites from https://www.spriters-resource.com/mobile/mergefellas/asset/279334/ 


const SPEED = 7;
const PLAYER_SIZE = 50;
const STARTING_BASE = 3;
const B_SIZE = 50;
const CELL_SIZE = 20;
const EDGE = 8;
const OPEN_TILE = 0;
// cannot use traditional 0, 1, 2 representation for grid because its multiplayer; territory must be differentiated for every player.
const TERRITORY = 1000;
const TRAIL = 2000;
const WORLD_COLS = 75;
const WORLD_ROWS = 75;
let shared, guests, my;
let test;
let players = [];
let soccerBrainrot;
let crocoBrainrot;
let hexagonRadius = 30;
let startButton;
let timer;
let bot;
let grid;
let cols; 
let rows;
let playerSprite;
let startX;
let startY;
let spawned = false;


let theColor = ["red", "blue", "green", "orange", "yellow"];

function preload(){
  soccerBrainrot = loadImage("soccer-brainrot.jpg");
  crocoBrainrot = loadImage("crocodile-brainrot.jpg");
  //soccerAni = loadAni("soccer-brainrot.jpg", 1, 8);
  
  
  partyConnect("wss://deepstream-server-1.herokuapp.com","grid.io");
  shared = partyLoadShared("shared", {
    playerPerspective: 3,
    grid: null
    
  });
  guests = partyLoadGuestShareds();
  my = partyLoadMyShared();
}
function worldGrid(x, y){
  return {
    gx: Math.floor(x / CELL_SIZE),
    gy: Math.floor(y / CELL_SIZE)
  };
}
class Player {
  constructor(x, y, dx, dy, direction){
    this.x = x;
    this.y = y;
    this.dx = dx;
    this.dy = dy;
    this.id = Math.floor(Math.random()* 1000);
    this.color = random(theColor);
    this.direction  = direction;
    this.trail = [];
    this.killstreak = 0;
    this.outside = true;
    this.isAlive = true;
    this.killcount = 0;
  }
  update(){
    if (this.isAlive){
      let i = input();
      this.dx = lerp(this.dx, i.x * SPEED, 0.1);
      this.dy = lerp(this.dy, i.y * SPEED, 0.1);
      this.x += this.dx;
      this.y += this.dy;
      let { gx, gy} = worldGrid(this.x, this.y);
      
      if ( gy < 0 || gy >= grid.length || gx < 0 || gx >= grid[0].length){
        return;
      } 
      let cell = grid[gy][gx];
      if(cell === OPEN_TILE){
        this.outside = true;
        grid[gy][gx] = TRAIL + this.id;
        this.trail.push({x: gx, y: gy});
      }

      if(cell === TERRITORY + this.id && this.outside){
        this.outside = false;
        captureTerritory(this);
      }
    }
  }
  territory(){
    stroke(0);
    noStroke();
  }
}
function setup() {
  createCanvas(windowWidth, windowHeight);
  imageMode(CENTER);
  cols = WORLD_COLS;
  rows = WORLD_ROWS;
  if (partyIsHost){
    shared.grid = generateGrid(cols, rows);
    shared.players = {};
  }
  grid = shared.grid;
  if(!grid){
    return;
  }
  let gx, gy;
  do {
    gx = floor(random(STARTING_BASE, cols - STARTING_BASE));
    gy = floor(random(STARTING_BASE, rows - STARTING_BASE));
  }
  while (!isAreaFree(gx, gy));
  let initX = gx * CELL_SIZE;
  let initY = gy * CELL_SIZE;
  my.player = new Player(initX, initY,0,0,0,0);
  initTerritory(my.player.id, gx, gy);
  
  shared.players[my.id] = {
    id: my.player.id, 
    spawn: hostSpawnPlayer(my.player.id)
  };
  //put my player on the grid
  //if (!shared.guests){
  //  shared.players = {};
  //}
  //shared.players[my.id] = {x: playerSprite.x, y:playerSprite.y, color: 'blue'};
  console.log("me", JSON.stringify(my));
  console.log("guests", JSON.stringify(guests));
 
 
  //gridOutput(LABEL);
}

function draw() {
  if (!shared.grid){
    return;
  }
  grid = shared.grid;
  if(!spawned){
    hostSpawnPlayer();
    spawned = true;
  }
  translate(width/2 - my.player.x, height/2 - my.player.y);
  background(0);
  displayGrid();
  drawHexagonGrid();
  updatePlayer();
  drawPlayers();
  botMovement();
  drawMinimap(my.player.x, my.player.y, my.player.territory);
}

function botMovement(){
  //move bot 10% of distance to the player every draw call
  //bot.moveTowards(g.player.x, g.player.y, 0.10);
}
function isGridReady() {
  return grid && grid.length === rows && grid[0] !== null;

}

function homeScreenOverlay(){
  startButton = createButton("Play");
  startButton.position(width / 2, height / 2);
  startButton.style("background-color", "blue");
  startButton.style('width',  '150px');
  startButton.style('height', '50px');
  startButton.mousePressed(gameState); 
}
function gameState(){
  my.player.isAlive = true;
}
function createGrid(cols, rows){
  let theGrid = [];
  for (let y = 0; y < rows; y++){
    theGrid.push([]);
    for (let x = 0; x < cols; x++) {
      theGrid[y].push(OPEN_TILE);
    }
  }
  return theGrid;
}
function drawGrid() {
  for(let y = 0; y < rows; y++){
    for (let x = 0; x < cols; x ++) {
      let v = grid[y][x];
      if (v >= TERRITORY){
        let [r, g, b] = playerColor(ownerId);
        fill(r, g, b, 150);
      }
      else if ( v >= TRAIL) {
        fill(255);
      }
      else {
        continue;
      }
    }
    rect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE);
  }
}
function playerColor(id){
  const colors = [[255, 0, 0], [0, 0, 255], [0, 255, 0], [255, 160, 60], [180, 80, 255]];
  return colors[Math.abs(id) % colors.length];
}
function spawnPlayer() {
  let gx, gy;
  if (partyIsHost) {
    do {
      gx = floor(random(STARTING_BASE, cols - STARTING_BASE));
      gy = floor(random(STARTING_BASE, rows - STARTING_BASE));

    }
    while(!isAreaFree(gx, gy));
    initTerritory(my.player.id, gx, gy);

    shared.players[my.id] = {
      id: my.player.id,
      gx, gy, 
      kills: 0,
      alive: true
    };
  }
  let spawn = shared.players[my.id];
  
}
// grid design from https://editor.p5js.org/kybr/sketches/r_1FNQE5W;
function hexagonGrid(gridX, gridY, r){
  beginShape(LINES);
  let angle = 2 * PI / 6 /2;
  for (let i = 0; i < 6; i++) {
    vertex(gridX + r * cos(angle), gridY + r * sin(angle));
    angle += 2 * PI / 6;
    vertex(gridX + r * cos(angle), gridY + r * sin(angle));
  }
  endShape();
}
function drawHexagonGrid(){
  const X_OFFSET = hexagonRadius * cos(PI / 6);
  const Y_OFFSET = hexagonRadius * sin(PI / 6) + hexagonRadius;
  const X_SPACE = 2 * X_OFFSET;
  const Y_SPACE = 2 * Y_OFFSET;
  for (let y = 0; y < windowHeight; y += Y_SPACE) {
    for (let x = 0; x < windowWidth; x += X_SPACE) {
      stroke('pink');
      strokeWeight(7);
      strokeWeight(1);
      hexagonGrid(x, y, hexagonRadius * 0.9);
      hexagonGrid(x + X_OFFSET, y + Y_OFFSET, hexagonRadius * 0.9);
    }
  }
}
function isAreaFree(checkX, checkY) {
  if(!grid){
    return false;
  }
  for ( let y = - STARTING_BASE; y <= STARTING_BASE; y++ ) {
    for ( let x = -STARTING_BASE; x <= STARTING_BASE; x++){
      let gx = checkX + x;
      let gy = checkY + y;
      if (gx < 0 || gx >= cols || gy < 0 || gy >= rows || !grid[gy]){
        return false;
      }
      if (grid[gy][gx] !== OPEN_TILE){
        return false;
      }
    }
  }
  return true;
}
function initTerritory(playerId, centerGX, centerGY){
  for ( let y = - STARTING_BASE; y <= STARTING_BASE; y++ ) {
    for ( let x = -STARTING_BASE; x <= STARTING_BASE; x++){
      let gx = centerGX + x;
      let gy = centerGY + y;
      if( gx >= 0 && gx < cols && gy >= 0 && gy < rows){
        grid[centerGY + x][centerGX + x] = TERRITORY + playerId;
      }
    }
  }
}
function hostSpawnPlayer(playerId){
  let gx, gy;
  do {
    gx = floor(random(STARTING_BASE, cols - STARTING_BASE));
    gy = floor(random(STARTING_BASE, rows - STARTING_BASE));
  }
  while(!isAreaFree(gx, gy));
  for ( let y = -STARTING_BASE; y <= STARTING_BASE; y++) {
    for (let x = -STARTING_BASE; x <= STARTING_BASE; x++) {
      let nx = gx + x;
      let ny = gy + y;
      grid[ny][nx] = TERRITORY + playerId;
    }
  }
  return {gx, gy };
}
function drawPlayers(){
  for(let g of guests) {
    
    fill (playerColor(g.player.id));
    noStroke();
    // beginShape();
    //fill(g.player.color);
    //vertex(startX - 75, startY - 75);
    //vertex(startX- 75, startY + 75);
    //vertex(startX + 75, startY + 75);
    //vertex(startX+ 75, startY-75);
    //endShape(CLOSE);
    image(soccerBrainrot, g.player.x, g.player.y, PLAYER_SIZE, PLAYER_SIZE);
  }
  fill (playerColor(my.player.id));
  image(soccerBrainrot, my.player.x, my.player.y, PLAYER_SIZE, PLAYER_SIZE);
}
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
function checkCollisions(playerX, playerY, guestX, guestY){
  playerX = my.player.x;
  playerY  = my.player.y;
  guestX = g.player.x;
  guestY  = g.player.y;
}

function generateGrid(cols, rows) {
  let newGrid = [];
  for (let y = 0; y < rows; y++) {
    newGrid.push([]);
    for (let x = 0; x < cols; x++) {
      newGrid[y].push(OPEN_TILE);
    }
  }
  return newGrid;
}

function displayGrid(){
  for(let y = 0; y < rows; y++){
    for(let x = 0; x < cols; x++){
      let v = grid[y][x];
      if ( v === OPEN_TILE ){
        continue;
      }
      let screenX = x * CELL_SIZE;
      let screenY = y * CELL_SIZE;

      if ( v >= TERRITORY){
        let ownerId = v - TERRITORY;
        let [r, g, b] = playerColor(ownerId);
        fill(r, g, b, 150);
      }
      else if ( v >= TRAIL) {
        let ownerId = v - TRAIL;
        let [r, g, b] = playerColor(ownerId);
        fill(r, g, b, 255);
      }
      noStroke();
      rect(screenX, screenY, CELL_SIZE, CELL_SIZE);
    } 
  } 
}
function captureTerritory(player){
  for(let g of guests){
    for (let t of g.player.trail) {
      grid[t.y][t.x] = TRAIL;
    }
    let isVisited = Array.from( {length: rows}, () =>
      Array(cols).fill(false)
    );
    for(let x = 0; x < cols; x++){
      if (grid[0][x] === OPEN_TILE){
        floodfill(x, 0, isVisited);
      }
      if(grid[rows -1][x] === OPEN_TILE){
        floodfill(x, rows - 1, isVisited);
      }
    }
    for(let y = 0; y < rows; y++) {
      if (grid[y][0] === OPEN_TILE){
        floodfill(0, y, isVisited);
      }
      if(grid[y][cols - 1] === OPEN_TILE){
        floodfill(cols - 1, y, isVisited);
      }
    }
    for(let y = 0; y < rows; y++){
      for(let x = 0; x < cols; x++){
        if(grid[y][x] === OPEN_TILE && !isVisited[y][x]) {
          grid[y][x] = TERRITORY + player.id;
        }
      }
    }
    for( let t of g.player.trail){
      grid[t.y][t.x] = TERRITORY +player.id;
    }
    player.trail = [];
  }
}
function checkKills(player, gx, gy) {
  let cell = grid[gy][gx];
  if ( cell >= TRAIL && cell < TERRITORY && cell !== TRAIL + player.id){
    let victimId = cell - TRAIL;
    killPlayer(victimId, player.id);
  }
}
function killPlayer (victimId, killderId){
  let victim = Object. values(shared.players.find(p => p.id === victimId));
  if ( !victim || !victim.alive){
    return;
  }
  victim.alive = false;
  shared.players[killerId].kills++;
  clearPlayerTrail(victimId);
  Respawn(victimId);
}

function clearPlayerTrail(id){
  for (let y = 0; y < rows; y ++ ) {
    for ( let x = 0; x < cols; x++) {
      if (grid[y][x] === TRAIL + id ) {
        grid[y][x] = OPEN_TILE;
      }
    }
  }
}


function floodfill(startX, startY, isVisited){
  let toFill = [];
  toFill.push({x: startX, y: startY});
  isVisited[startY][startX] = true;
  while(toFill.length > 0) {
    let { x, y } = toFill.shift();
    let fillSpots = [
      { x: x + 1, y},
      {x: x - 1, y},
      {x,  y: y + 1},
      {x, y: y - 1},
    ];
    for( let f of fillSpots){
      if ( f.x >= 0 && f.x < cols && f.y >= 0 && f.y < rows && !isVisited[f.y][f.x] && grid[f.y][f.x] === OPEN_TILE){
        isVisited[f.y][f.x] = true;
        toFill.push(f);
      }
    }
  }
}
function updatePlayer(){
  my.player.update();
}

function gameLogic(){

}

//disc room clone input functions
function moveLeft(){
  return keyIsDown(LEFT_ARROW) || keyIsDown(65);
}
function moveRight(){
  return keyIsDown(RIGHT_ARROW) || keyIsDown(68);
}
function moveUp(){
  return keyIsDown(UP_ARROW) || keyIsDown(87);
}
function moveDown(){
  return keyIsDown(DOWN_ARROW) || keyIsDown(83);
}
function horizontalMovement(){
  return moveRight() - moveLeft();
}
function verticalMovement(){
  return moveDown() - moveUp();
}
function input(){
  return {x: horizontalMovement(), y: verticalMovement() };
}