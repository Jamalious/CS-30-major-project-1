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
const WORLD_WIDTH = WORLD_COLS * CELL_SIZE;
const WORLD_HEIGHT = WORLD_ROWS * CELL_SIZE;
const MINIMAP_SIZE = 200;
const MINIMAP_PADDING = 20;
const SERVER_TICK_RATE = 100;
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
let hostPlayers = {};
let hostNextGameId = 1;
let spawned = false;
let partyReady = false;
let lastServerTick = 0;
let initHost = false;


let theColor = ["red", "blue", "green", "orange", "yellow"];

function preload(){
  soccerBrainrot = loadImage("soccer-brainrot.jpg");
  crocoBrainrot = loadImage("crocodile-brainrot.jpg");
  //soccerAni = loadAni("soccer-brainrot.jpg", 1, 8);
  partyConnect("wss://deepstream-server-1.herokuapp.com","grid-room-1");
  shared = partyLoadShared("shared", {
    playerPerspective: 3,
    grid: null,
    players: {},
    leaderboard: {}, 
    nextGameId: 1,
    trails: {},
    spawnedIds: {}
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
  constructor(x, y, dx, dy, direction, gameId){
    this.gameId = gameId;
    this.x = x;
    this.y = y;
    this.dx = dx;
    this.dy = dy;
    this.color = random(theColor);
    this.direction  = direction;
    this.trail = [];
    this.killstreak = 0;
    this.outside = true;
    this.isAlive = true;
    this.prevX = x;
    this.prevY = y;
    this.killcount = 0;
  }
  update(ix, iy){
    if (!this.isAlive){
      return;
    }
    if (this.isAlive){
      this.prevX = this.x;
      this.prevY = this.y;
      let oldX = this.prevX;
      let oldY = this.prevY;
      // Locking movement until an input is given. Although x, y, dx, dy are zero, lerp produces float movement so the player leaves base immediately 

      if (ix === 0 && iy === 0){
        return;
      }

      this.dx = lerp(this.dx, ix * SPEED, 0.1);
      this.dy = lerp(this.dy, iy * SPEED, 0.1);
      this.x += this.dx;
      this.y += this.dy;
      if (partyIsHost()){
        if (checkLinekills(this, oldX, oldY, this.x, this.y)){
          return;
        }
      }
      let { gx, gy} = worldGrid(this.x, this.y);
      
      if ( gy < 0 || gy >= grid.length || gx < 0 || gx >= grid[0].length){
        return;
      } 
      let cell = grid[gy][gx];
      //if (partyIsHost()) {
      // //checkKills(this, cell);
      //}
      if(cell === OPEN_TILE){
        this.outside = true;

        if (partyIsHost()) {
          if (!shared.trails[this.gameId]) {
            shared.trails[this.gameId] = [];
          }
          grid[gy][gx] = TRAIL + this.gameId;
          shared.trails[this.gameId].push({x: gx, y: gy});
        }
      }

      if(cell === TERRITORY + this.gameId && this.outside){
        this.outside = false;
        if (partyIsHost()) {
          captureTerritory(this);
        }
      }

      this.x = constrain(this.x, PLAYER_SIZE /2, WORLD_WIDTH - PLAYER_SIZE / 2 );
      this.y = constrain(this.y, PLAYER_SIZE / 2, WORLD_HEIGHT - PLAYER_SIZE /2);
      gx = constrain(gx, 0, WORLD_COLS - 1);
      gy = constrain(gy, 0, WORLD_ROWS - 1);
    }
  }
  territory(){
    stroke(0);
    noStroke();
  }
}
function setup() {
  createCanvas(windowWidth, windowHeight);
  imageMode(CORNER);
  cols = WORLD_COLS;
  rows = WORLD_ROWS;
  if (partyIsHost()){
    if (!shared.grid){
      shared.grid = generateGrid(cols, rows);
    }
  }

  //put my player on the grid
  //if (!shared.guests){
  //  shared.players = {};
  //}
  //shared.players[my.id] = {x: playerSprite.x, y:playerSprite.y, color: 'blue'};
  console.log("me", JSON.stringify(my));
  console.log("guests", JSON.stringify(guests));
  console.log("Am I host", partyIsHost());
 
 
  //gridOutput(LABEL);
}

function draw() {
  // Wait until party is connected
  if (my && my.id){
    my.lastSeen = millis();
  }
  if (!partyIsHost()){
    let isGuest = guests.find(g => g.id === my.id);
    if (isGuest){
      isGuest.lastSeen = millis();
    }
  }
  if (partyIsHost()){
    for (let g of guests){
      if (g.id){
        g.lastSeen = millis();
      }
    }
  }
  if (partyIsHost() && !partyReady) {
    becomeHost();
  }
  if (!shared || !guests || !my) {
    background(0);
    fill(255);
    textAlign(CENTER, CENTER);
    textSize(32);
    text("Connecting to server", width / 2, height / 2);
  }
  //if (partyIsHost() && !my.spawnRequested && !shared.players?.[my.id]){
  //// my.spawnRequested = true;
  //}
  if (!my){
    return;
  }
  if (!my.id){
    my.id = crypto.randomUUID();
    my.spawnRequested = true;
    console.log("Assigned my.id:", my.id);
  }
  grid = shared.grid;
  if (partyIsHost()) {
    let now = millis();
    if (now - lastServerTick >= SERVER_TICK_RATE){
      lastServerTick = now;
    }
    hostHandleSpawn();
    hostUpdatePlayers();
    disconnectedPlayers();
    updateLeaderboard();

  }

  checkSpawn();
  if (!my.player){
    background(0);
    fill(255);
    textAlign(CENTER, CENTER);
    textSize(32);
    text ("Waiting for host to spawn you", width / 2, height /2 );
    return;
  }
  background(0);
  let me = shared.players[my.id];
  if (!me){
    return;
  }
  translate(width/2 - me.x, height/2 - me.y);
  displayGrid();
  drawHexagonGrid();
  drawPlayers();
  updatePlayer();
  drawWorldBorder();
  drawLeaderboard();
  drawMinimap();
  playerKills();
  botMovement();
  //drawMinimap(my.player.x, my.player.y, my.player.territory);
}

function botMovement(){
  //move bot 10% of distance to the player every draw call
  //bot.moveTowards(g.player.x, g.player.y, 0.10);
}
function isGridReady() {
  return grid && grid.length === rows && grid[0] !== null;

}
function becomeHost() {
  if (initHost){
    return;
  }
  initHost = true;
  partyReady = true;
  lastServerTick = millis();
  if (!shared.grid) {
    shared.grid = generateGrid(cols, rows);
  }
  if (!shared.players) {
    shared.players = {};
  }
  if (!shared.trails) {
    shared.trails = {};
  }
  if (!shared.leaderboard) {
    shared.leaderboard = {};
  }
  if (!shared.spawnedIds) {
    shared.spawnedIds = {};
  }
  hostPlayers = {};
  for (let id in shared.players) {
    let p = shared.players[id];
    hostPlayers[id] = new Player(p.x, p.y, 0, 0, 0, p.gameId);
    hostPlayers[id].outside = false;
  }
}
function hostHandleSpawn() {
  if (!partyIsHost() || !shared.grid){
    return;
  }
  // Host spawn
  if ( my.id && my.spawnRequested && !shared.players[my.id]) {
    hostSpawnPlayer(my.id);
  }
  for (let g of guests){
    if (!g.id){
      continue;
    }
    if (!g.spawnRequested){
      continue;
    }
    if (shared.players[g.id]){
      continue;
    }
    hostSpawnPlayer(g.id);
    g.spawnRequested = false;
  }
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
function drawWorldBorder() {
  push();
  noFill();
  stroke(0, 200, 255);
  strokeWeight(4);
  rect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
  pop();
}
function playerColor(id){
  const colors = [[255, 0, 0], [0, 0, 255], [0, 255, 0], [255, 160, 60], [180, 80, 255]];
  return colors[Math.abs(id) % colors.length];
}
// only host can spawn player
function hostSpawnPlayer(playerId) {
  if (!partyIsHost()){
    return;
  }
  if (!playerId){
    return;
  }
  if (shared.players[playerId]){
    return;
  }
  if (shared.spawnedIds[playerId]){
    return;
  }
  if (!grid){
    return;
  }
  let gx, gy;
  let attempts = 0;
  const MAX_ATTEMPTS = 500;
  do {
    gx = floor(random(STARTING_BASE, cols - STARTING_BASE));
    gy = floor(random(STARTING_BASE, rows - STARTING_BASE));
    attempts++;
  }
  while(!isAreaFree(gx, gy) && attempts < MAX_ATTEMPTS);
  if (attempts >= MAX_ATTEMPTS) {
    return;
  }
  let gameId = generateGameId();
  initTerritory(gameId, gx, gy);
  let worldX = gx * CELL_SIZE + CELL_SIZE / 2;
  let worldY = gy * CELL_SIZE + CELL_SIZE / 2;

  shared.players[playerId] = {
    id: playerId,
    gameId: gameId,
    gx, gy, 
    alive: true,
    kills: 0,
    x: worldX,
    y: worldY,
    joinedAt: millis()
  };
  hostPlayers[playerId] = new Player(worldX, worldY, 0, 0, 0, gameId);
  hostPlayers[playerId].outside = false;
  shared.spawnedIds[playerId] = true;
  let guest = guests.find(g => g.id === playerId);
  if (guest){
    guest.spawnRequested = false;
  }
  console.log("Spawned player", playerId, "with gameId", gameId);
}
function hostUpdatePlayers() {
  let ix = horizontalMovement();
  let iy = verticalMovement();
  ix = constrain(ix, -1, 1);
  iy = constrain(iy, -1, 1);
  //my.inputX = ix;
  //my.inputY = iy;
  if (!partyIsHost()){
    return;
  }
  for (let id in hostPlayers) {
    let simPlayer = hostPlayers[id];
    let netPlayer = shared.players[id];
    let guest = guests.find(g => g.id === id) || my;
    if (!simPlayer || !netPlayer || !guest) {
      continue;
    }
    let ix = guest.inputX || 0;
    let iy = guest.inputY || 0;
    simPlayer.update(ix, iy);

    netPlayer.x = simPlayer.x;
    netPlayer.y = simPlayer.y;
  }
}
function checkSpawn() {
  let spawn = shared.players[my.id];
  if (!spawn){
    return;
  }
  if(!my.player){
    let worldX = spawn.gx * CELL_SIZE + CELL_SIZE / 2;
    let worldY = spawn.gy * CELL_SIZE + CELL_SIZE / 2;
    my.player = new Player(worldX, worldY, 0, 0, 0, spawn.gameId);
    my.player.outside = false;
    spawned = true;
    console.log("Spawned local player:", my.id, spawn.gameId);
  }
}
function generateGameId() {
  const id = shared.nextGameId;
  shared.nextGameId++;
  return id;
  //const id = shared.nextGameId;
  //shared.nextGameId+= 1;
  //console.log("Issuing gameId:", id);
  // return id;
  // let id;
  // do {
  // id = Math.floor(Math.random() * 1000);
  //}
  //while(Object.values(shared.players).some(p => p.gameId === id));
  //return id;
}
function syncPlayer() {
  if (!partyIsHost()){
    return;
  }
  for (let g of guests) {
    if (shared.players[g.id] && typeof g.x === "number" && typeof g.y === "number") {
      shared.players[g.id].x = g.x;
      shared.players[g.id].y = g.y;
    }
  }
}
// grid design from https://editor.p5js.org/kybr/sketches/r_1FNQE5W;
function hexagonGrid(x, y, r){
  beginShape();
  for (let i = 0; i < 6; i ++) {
    let a = PI /3 * i + PI /6;
    vertex(x + cos(a) * r, y + sin(a) * r);
  }
  endShape(CLOSE);
  //let angle = 2 * PI / 6 /2;
  //for (let i = 0; i < 6; i++) {
  //vertex(gridX + r * cos(angle), gridY + r * sin(angle));
  //angle += 2 * PI / 6;
  //vertex(gridX + r * cos(angle), gridY + r * sin(angle));
  //}
  //endShape();
}
function drawHexagonGrid(){
  drawingContext.shadowBlur = 18;
  drawingContext.shadowColor = 'rgba (80, 160, 255, 0.4)';
  const r = hexagonRadius;
  const w = sqrt(3) * r;
  const vert = 1.5 * r;
  push();
  resetMatrix();
  
  const cols = ceil(width / w) + 2;
  const rows = ceil(height / vert) + 2;
  let t = millis() * 0.001;
  for (let y = -1; y < rows; y++) {
    for (let x = -1; x < cols; x++) {
      let offset =  y % 2 * w / 2 ;
      let px = x * w + offset;
      let py = y * vert;
      let pulse = sin (t + (x + y) * 0.4) * 4;
      stroke(120 + pulse * 10, 80 + pulse * 20, 255);
      strokeWeight(1.2 + pulse * 0.05);
      noFill();
      hexagonGrid(px, py, r + pulse * 0.15);
    }
  }
  drawingContext.shadowBlur = 0;
  pop();
// const X_OFFSET = hexagonRadius * cos(PI / 6);
//const Y_OFFSET = hexagonRadius * sin(PI / 6) + hexagonRadius;
// const X_SPACE = 2 * X_OFFSET;
//  const Y_SPACE = 2 * Y_OFFSET;
//  for (let y = 0; y < windowHeight; y += Y_SPACE) {
//    for (let x = 0; x < windowWidth; x += X_SPACE) {
//      stroke('pink');
//      strokeWeight(7);
//      strokeWeight(1);
//      hexagonGrid(x, y, hexagonRadius * 0.9);
//      hexagonGrid(x + X_OFFSET, y + Y_OFFSET, hexagonRadius * 0.9);
//    }
// }
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
function initTerritory(gameId, centerGX, centerGY){
  if (!partyIsHost()){
    return;
  }
  for ( let y = - STARTING_BASE; y <= STARTING_BASE; y++ ) {
    for ( let x = -STARTING_BASE; x <= STARTING_BASE; x++){
      let gx = centerGX + x;
      let gy = centerGY + y;
      if( gx >= 0 && gx < cols && gy >= 0 && gy < rows){
        shared.grid[gy][gx] = TERRITORY + gameId;
      }
    }
  }
}

function drawPlayers(){
  noTint();
  //if (my.player){
  //  image(soccerBrainrot, my.player.x, my.player.y, PLAYER_SIZE, PLAYER_SIZE);
  // }
  for(let id in shared.players) {
    //if ( id === my.id){
    //  continue;
    //}
    let p = shared.players[id];
    if (!p || typeof p.x !== "number" || typeof p.y !== "number"){
      continue;
    }
    // beginShape();
    //fill(g.player.color);
    //vertex(startX - 75, startY - 75);
    //vertex(startX- 75, startY + 75);
    //vertex(startX + 75, startY + 75);
    //vertex(startX+ 75, startY-75);
    //endShape(CLOSE);
    image(soccerBrainrot, p.x - PLAYER_SIZE / 2, p.y - PLAYER_SIZE / 2, PLAYER_SIZE, PLAYER_SIZE);
  }
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
      else if ( v >= TRAIL && v <= TERRITORY) {
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
  if (!partyIsHost()){
    return;
  }
  let trail = shared.trails[player.gameId];
  if (!trail || trail.length === 0) {
    return;
  }
  for (let t of trail) {
    grid[t.y][t.x] = TRAIL + player.gameId;
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
        grid[y][x] = TERRITORY + player.gameId;
      }
    }
  }
  for( let t of trail){
    grid[t.y][t.x] = TERRITORY + player.gameId;
  }
  shared.trails[player.gameId] = [];
}
function checkKills(player, cell) {
  if (!partyIsHost()){
    return;
  }
  // If stepping on someone else's trail
  if ( cell >= TRAIL && cell < TERRITORY && cell !== TRAIL + player.gameId){
    let victimId = cell - TRAIL;
    killPlayer(victimId, player.gameId);
  }
}
function checkLinekills(player, x1, y1, x2, y2) {
  if (!partyIsHost()){
    return;
  }
  let distance = dist(x1, y1, x2, y2);
  let steps = ceil(distance) / CELL_SIZE * 0.4;

  for (let i = 0; i <= steps; i++) {
    let t = i / steps;
    let sx = lerp (x1, x2, t);
    let sy = lerp(y1, y2, t);
    let {gx, gy} = worldGrid(sx, sy);
    if (gx < 0 || gx >= cols || gy < 0 || gy >= rows){
      continue;
    }
    let cell = grid[gy][gx];

    if (cell >= TRAIL && cell < TERRITORY && cell !== TRAIL + player.gameId){
      let victimGameId = cell - TRAIL;
      killPlayer(victimGameId, player.gameId);
      return true;
    }
  }
  return false;
}
function killPlayer(victimGameId, killerGameId){
  if (!partyIsHost()){
    return;
  }
  let victimId = Object.keys(shared.players).find(id => shared.players[id].gameId === victimGameId);
  if (!victimId){
    return;
  }
  // Find the killer's id
  for (let id in shared.players){
    if (shared.players[id].gameId === killerGameId){
      shared.players[id].kills++;
      break;
    }
  }
  if (victimId){
    hostRemovePlayer(victimId);
  }
}
function hostRemovePlayer(playerId){
  if (!partyIsHost()){
    return;
  }
  if (!shared.players[playerId]){
    return;
  }
  let gameId = shared.players[playerId].gameId;

  //clearing the killed players data from the grid
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (grid[y][x] === TERRITORY + gameId || grid[y][x] === TRAIL + gameId){
        grid[y][x] = OPEN_TILE;
      }
    }
  }
  delete shared.trails[gameId];
  delete hostPlayers[playerId];
  delete shared.players[playerId];
}
function disconnectedPlayers() {
  if (!partyIsHost()){
    return;
  }
  let now = millis();
  let TIMEOUT = 5000;
  let JOIN_GRACE = 4000;

  for (let playerId in shared.players){
    if (playerId === my.id){
      continue;
    }
    let player = shared.players[playerId];
    let client = guests.find(g => g.id === playerId);
    if (player.joinedAt && now - player.joinedAt < JOIN_GRACE){
      continue;
    }
    if (!client){
      hostRemovePlayer(playerId);
      continue;
    }
    if (typeof client.lastSeen !== "number"){
      continue;
    }
    if (now - client.lastSeen > TIMEOUT){
      hostRemovePlayer(playerId);
    }
  }
}
function clearPlayerTrail(id){
  if (!partyIsHost()){
    return;
  }
  for (let y = 0; y < rows; y ++ ) {
    for ( let x = 0; x < cols; x++) {
      if (grid[y][x] === TRAIL + id ) {
        grid[y][x] = OPEN_TILE;
      }
    }
  }
}

function calculateTerritoryScores() {
  let scores = {};
  for ( let id in shared.players){
    let p = shared.players[id];
    scores[p.gameId] = 0;
  }

  for(let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      let v = grid[y][x];
      if (v>= TERRITORY) {
        let ownerId = v - TERRITORY;
        if (scores[ownerId] !== undefined) {
          scores[ownerId]++;
        }
      }
    }
  }
  return scores;
}
function updateLeaderboard() {
  if (!partyIsHost()){
    return;
  }
  shared.leaderboard = calculateTerritoryScores();
}
function drawLeaderboard() {
  if (!shared.leaderboard){
    return;
  }
  push();
  resetMatrix();
  textAlign(LEFT, TOP);
  textSize(20);
  fill(255);
  //territory sorting;
  let entries = Object.entries(shared.leaderboard).sort((a, b) => b[1] - a[1]); 
  let x = 20;
  let y = 20;
  text("Leaderboard", x, y);
  y += 30;
  for ( let i = 0; i < entries.length; i++) {
    let [gameId, score] = entries[i];
    let line = `${ i + 1}. Player ${gameId} - ${score} tiles`;
    text(line, x, y);
    y += 24;
  }
  pop();
}
function playerKills() {
  //if (!my.player){
  //  return;
  // }
  //push();
  // resetMatrix();
  //textAlign(RIGHT, TOP);
  //textSize(20);
  //fill(255);

  //let kills = shared.players[my.id]?.kills || 0;
  //text( `💀 Kills: ${kills}`, width - 20, 20);
  //pop();
}
function drawMinimap() {
  if (! grid || !shared.players){
    return;
  }
  let mapSize = MINIMAP_SIZE;
  let tileW = mapSize / cols;
  let tileH = mapSize / rows;

  let x0 = width - mapSize - MINIMAP_PADDING;
  let y0 = MINIMAP_PADDING;
  push();
  resetMatrix();
  translate(x0, y0);

  //Background
  noStroke();
  fill(20, 200);
  rect(0, 0, mapSize, mapSize, 10);

  //Drawing the grid
  for (let y = 0; y < rows; y++){
    for (let x = 0; x < cols; x++) {
      let v = grid[y][x];
      if ( v === OPEN_TILE){
        continue;
      }
      if (v >= TERRITORY) {
        let ownerId = v - TERRITORY;
        let [r, g, b] = playerColor(ownerId);
        fill(r, g, b);
      }
      else if (v >= TRAIL) {
        fill(255);
      }
      rect(x * tileW, y * tileH, tileW, tileH);
    }
  }
  for (let id in shared.players) {
    let p = shared.players[id];
    if (!p) {
      continue;
    }
    let px = p.x / (cols * CELL_SIZE) * mapSize;
    let py = p.y / (rows * CELL_SIZE) * mapSize;
    if (id === my.id ) {
      fill(255);
      stroke(0);
      strokeWeight(2);
      ellipse(px, py, 8, 8);
    }
    else {
      let [r, g, b] = playerColor(p.gameId);
      fill ( r, g, b);
      noStroke();
      ellipse(px, py, 6, 6,);
    }
  }
  //Border 
  noFill();
  stroke(255);
  strokeWeight(2);
  rect(0, 0, mapSize, mapSize, 10);
  pop();
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
  my.inputX = horizontalMovement();
  my.inputY = verticalMovement();
  my.inputX = constrain(my.inputX, -1, 1);
  my.inputY = constrain(my.inputY, -1, 1);
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