/**
 * Made with p5play!
 * https://p5play.org
 */

// Paper.io lite
// John Asiamah
// 1/19/2025
//
// Extra for Experts:
// - describe what you did to take this project "above and beyond"
// - Animated player movements
// - Used p5 party for multiplayer

// sprites from https://www.spriters-resource.com/mobile/mergefellas/asset/279334/ 


const SPEED = 7;
const PLAYER_SIZE = 50;
const STARTING_BASE = 3;
const CELL_SIZE = 20;
const OPEN_TILE = 0;
const TRAIL = 2000;
const TERRITORY = 1000;
const WORLD_COLS = 75;
const WORLD_ROWS = 75;
const WORLD_WIDTH = WORLD_COLS * CELL_SIZE;
const WORLD_HEIGHT = WORLD_ROWS * CELL_SIZE;
const MINIMAP_SIZE = 200;
const MINIMAP_PADDING = 20;
const SERVER_TICK_RATE = 100;
const BOOST_MULTIPLIER = 2.2;
const BOOST_DURATION = 1200;
const BOOST_COOLDOWN = 3000;
const BOOST_DRAIN_RATE = 1;
const POWERUP = 3000;
const POWER_BONUS = 1;
const POWER_TRAP = 2;
const POWER_SPAWN_INTERVAL = 6000;
const POWER_LIFETIME = 11000;
const MATCH_DURATION = 60000;
let shared, guests, my;
let test;
let players = [];
let soccerBrainrot;
let crocoBrainrot;
let hexagonRadius = 30;
let grid;
let cols; 
let rows;
let hexCache = null;
let startX;
let startY;
let hostPlayers = {};
let hostNextGameId = 1;
let spawned = false;
let partyReady = false;
let lastServerTick = 0;
let initHost = false;
let captureSound;
let lastPowerSpawn = 0;
let territoryFlashes = [];


let theColor = ["red", "blue", "green", "orange", "yellow"];

function preload(){
  soccerBrainrot = loadImage("soccer-brainrot.jpg");
  crocoBrainrot = loadImage("crocodile-brainrot.jpg");
  captureSound = loadSound("capture.mp3");
  //soccerAni = loadAni("soccer-brainrot.jpg", 1, 8);
  partyConnect("wss://deepstream-server-1.herokuapp.com","grid-room-1");
  shared = partyLoadShared("shared", {
    playerPerspective: 3,
    grid: null,
    players: {},
    leaderboard: {}, 
    nextGameId: 1,
    trails: {},
    spawnedIds: {},
    powerups: [],
    matchStartTime: null,
    matchEnded: false,
    winner: null,
  });
  guests = partyLoadGuestShareds();
  my = partyLoadMyShared();
}
//creating the world
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
    this.direction  = direction;
    this.trail = [];
    this.outside = true;
    this.isAlive = true;
    this.prevX = x;
    this.prevY = y;
    this.isBoosting = false;
    this.boostEndTime = 0;
    this.lastBoostTime = 0;
    this.boostEnergy = 100;
    this.particles = [];
  }
  // takes in player movement functions
  update(ix, iy, boosting){
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
      let speed = SPEED;
      //applying the speed boost
      if (!this.isBoosting && this.boostEnergy < 100) {
        this.boostEnergy += 0.3;
      }
      if (boosting && !this.isBoosting && millis() - this.lastBoostTime > BOOST_COOLDOWN){
        this.isBoosting = true;
        this.boostEndTime = millis() + BOOST_DURATION;
        this.lastBoostTime = millis();
      }
      if (this.isBoosting && millis() > this.boostEndTime) {
        this.isBoosting = false;
      }
      if (this.isBoosting) {
        speed *= BOOST_MULTIPLIER;
        this.boostEnergy -= 0.8;
        this.spawnBoostParticles();
      }
      //'smooth' player movement
      this.dx = lerp(this.dx, ix * speed, 0.1);
      this.dy = lerp(this.dy, iy * speed, 0.1);
      this.x += this.dx;
      this.y += this.dy;
      //applying boost risk factor/ territory drain;
      if (this.isBoosting && partyIsHost()) {
        drainTerritory(this.gameId, BOOST_DRAIN_RATE);
      }
      // was supposed to kill player's
      if (partyIsHost()){
        if (checkLinekills(this, oldX, oldY, this.x, this.y)){
          return;
        }
      }
      // identifying the player's position on the grid(open tile, territory, trail)
      let { gx, gy} = worldGrid(this.x, this.y);
      
      if ( gy < 0 || gy >= grid.length || gx < 0 || gx >= grid[0].length){
        return;
      } 
      let cell = grid[gy][gx];

      if(cell === OPEN_TILE){
        this.outside = true;

        if (partyIsHost()) {
          if (!shared.trails[this.gameId]) {
            shared.trails[this.gameId] = [];
          }
          grid[gy][gx] = TRAIL + this.gameId;
          shared.trails[this.gameId].push({x: gx, y: gy});
          checkPowerup(this);
        }
      }

      if(cell === TERRITORY + this.gameId && this.outside){
        this.outside = false;
        if (partyIsHost()) {
          captureTerritory(this);
        }
      }
      // preventing player from exiting the grid
      this.x = constrain(this.x, PLAYER_SIZE /2, WORLD_WIDTH - PLAYER_SIZE / 2 );
      this.y = constrain(this.y, PLAYER_SIZE / 2, WORLD_HEIGHT - PLAYER_SIZE /2);
      gx = constrain(gx, 0, WORLD_COLS - 1);
      gy = constrain(gy, 0, WORLD_ROWS - 1);
    }
  }
  // creating particles whenever the player is boosting
  spawnBoostParticles(){
    for (let i = 0; i < 1; i++) {
      this.particles.push({
        x: this.x, 
        y:this.y, 
        vx: random(-2, 2),
        vy: random(-2, 2),
        life: 15
      });
    }
  }
  drawParticles(){
    for (let i = this.particles.length -1; i >= 0; i--){
      let p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life--;

      fill(0, 200, 255, p.life * 8);
      noStroke();
      ellipse(p.x, p.y, 6, 6);
      if (p.life <= 0){
        this.particles.splice(i, 1);
      }
    }
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
  if (!my){
    return;
  }
  // assigning players with their id's (not gameId's)
  if (!my.id){
    my.id = crypto.randomUUID();
    my.spawnRequested = true;
    console.log("Assigned my.id:", my.id);
  }
  // allows all the players to draw onto the same grid
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
    hostSpawnPowerups();
    hostRemovePowerups();
    hostCheckMatchTimer();
  }
  checkSpawn();

  //waiting screen for players while they wait for host to spawn them
  if (!my.player){
    background(0);
    fill(255);
    textAlign(CENTER, CENTER);
    textSize(32);
    text ("Waiting for host to spawn you", width / 2, height /2 );
    return;
  }

  background(0);
  //displaying the winner after the timer runs out
  if (shared.matchEnded) {
    drawWinnerScreen();
    return;
  }
  let me = shared.players[my.id];
  if (my.player && grid){
    let { gx, gy} = worldGrid(me.x, me.y);
    let cell = grid[gy]?.[gx];
    if (cell === OPEN_TILE || cell === TRAIL + me.gameId) {
      my.player.outside = true;
    }
    else if (cell === TERRITORY + me.gameId) {
      my.player.outside = false;
    }
  }

  //playing territory capture sound
  if (me?.justCaptured){
    if (captureSound.isLoaded) {
      captureSound.play();
    }
    me.justCaptured = false;
  }
  //capture Territory animation
  if (me?.flashTiles) {
    territoryFlashes = me.flashTiles;
  }
  if (me && my.player){
    my.player.boostEnergy = me.boostEnergy ?? my.player.boostEnergy;
    my.player.isBoosting = me.isBoosting ?? false;
  }
  if (!me){
    return;
  }
  translate(width/2 - me.x, height/2 - me.y);
  displayGrid();
  drawTerritoryFlash();
  drawPowerups();
  drawPlayers();
  drawHexagonGrid();
  updatePlayer();
  drawWorldBorder();
  drawLeaderboard();
  drawBoostMeter();
  drawMatchTimer();
  drawMinimap();
  playerKills();
  //drawMinimap(my.player.x, my.player.y, my.player.territory);
}

// ensuring the gridIsReady before spawning players into it
function isGridReady() {
  return grid && grid.length === rows && grid[0] !== null;

}
// ensuring that the host is properly reassigned to the the next player if the original host leaves
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
//ensuring the host handles all player spawns
function hostHandleSpawn() {
  if (!partyIsHost() || !shared.grid){
    return;
  }
  // Host spawns itself
  if ( my.id && my.spawnRequested && !shared.players[my.id]) {
    hostSpawnPlayer(my.id);
  }
  //host checks for guest spawn requests
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
//displaying the edge of the grid
function drawWorldBorder() {
  push();
  noFill();
  stroke(200, 0, 0);
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
  //insuring only the host can spawnPlayers
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
  if (!shared.matchStartTime) {
    shared.matchStartTime = millis();
  }
  let gx, gy;
  let attempts = 0;
  const MAX_ATTEMPTS = 500;

  //checking for open space
  do {
    gx = floor(random(STARTING_BASE, cols - STARTING_BASE));
    gy = floor(random(STARTING_BASE, rows - STARTING_BASE));
    attempts++;
  }
  while(!isAreaFree(gx, gy) && attempts < MAX_ATTEMPTS);
  if (attempts >= MAX_ATTEMPTS) {
    return;
  }
  //after free space is found, assigns a unique gameId for each player + puts them on the grid
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
  shared.matchStartTime = millis();
  shared.matchEnded = false;
  shared.winner = null;

  //instantiating a new player
  hostPlayers[playerId] = new Player(worldX, worldY, 0, 0, 0, gameId);
  hostPlayers[playerId].outside = false;
  shared.spawnedIds[playerId] = true;
  let guest = guests.find(g => g.id === playerId);
  if (guest){
    guest.spawnRequested = false;
  }
  console.log("Spawned player", playerId, "with gameId", gameId);
}

//each player's movement is controlled by the host
function hostUpdatePlayers() {
  let ix = horizontalMovement();
  let iy = verticalMovement();
  ix = constrain(ix, -1, 1);
  iy = constrain(iy, -1, 1);

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
    let boosting = guest.inputBoost;
    simPlayer.update(ix, iy, boosting);

    netPlayer.x = simPlayer.x;
    netPlayer.y = simPlayer.y;
    netPlayer.boostEnergy = simPlayer.boostEnergy;
    netPlayer.isBoosting = simPlayer.isBoosting;
    hostSpawnPowerups();
    hostRemovePowerups();
  }
}
// checking for spawned players
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

// generating incremental gameId's for each player
function generateGameId() {
  const id = shared.nextGameId;
  shared.nextGameId++;
  return id;
}
function syncPlayer() {
  if (!partyIsHost()){
    return;
  }
  //displaying positions of all players
  for (let g of guests) {
    if (shared.players[g.id] && typeof g.x === "number" && typeof g.y === "number") {
      shared.players[g.id].x = g.x;
      shared.players[g.id].y = g.y;
    }
  }
}
// grid design;
function hexagonGrid(x, y, r){
  beginShape();
  for (let i = 0; i < 6; i ++) {
    let a = PI /3 * i + PI /6;
    vertex(x + cos(a) * r, y + sin(a) * r);
  }
  endShape(CLOSE);
}

// displaying a cool hexagonal grid instead of a boring square grid
function drawHexagonGrid(){
  if (!hexCache) {
    hexCache = [];
    const size = CELL_SIZE * 0.6;
    const w = sqrt(3) * size;
    const h = 2 * size;;
    const vert = 1.5 * h;
    for (let y = 0; y < WORLD_ROWS; y++) {
      for (let x = 0; x < WORLD_COLS; x++) {
        let px = x * w + y % 2 * (w /2);
        let py = y * vert;
        hexCache.push({x: px, y:py});

      }
    }
  }
  push();
  noFill();
  stroke(255, 40);
  strokeWeight(1);
  const size = CELL_SIZE * 0.6;
  for (let h of hexCache) {
    hexagonGrid(h.x, h.y, size);
  }
  pop();
}

//ensuring each player spawns into open space
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
// creating a small base for each player when they spawn in
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
// drawing player's + displaying particles when boosting
function drawPlayers(){
  noTint();
  for(let id in shared.players) {
    let p = shared.players[id];
    if (!p || typeof p.x !== "number" || typeof p.y !== "number"){
      continue;
    }
    if (id === my.id && my.player && my.player.outside) {
      let [r, g, b] = playerColor(p.gameId);
      drawPlayerGlow(p.x, p.y, PLAYER_SIZE, r, g, b);
    }
    image(soccerBrainrot, p.x - PLAYER_SIZE / 2, p.y - PLAYER_SIZE / 2, PLAYER_SIZE, PLAYER_SIZE);
    
    if (hostPlayers[id]) {
      hostPlayers[id].drawParticles();
    }
    if (my.player) {
      my.player.drawParticles();
    }
  }
}
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
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
// displaying the grid (mostly hidden)
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
  // if player is within territory, captureTerritory doesn't run
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
  //applying the floodfill algorithm when player creates a closed loop
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
  //converting open space into territory after closed loop is created
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
  let playerId = Object.keys(shared.players).find (id => shared.players[id].gameId === player.gameId);
  if (playerId) {
    shared.players[playerId].flashTiles = trail.map(t =>({
      x: t.x, 
      y: t.y, 
      life: 25
    }));
  }
  if (playerId && shared.players[playerId]) {
    shared.players[playerId].justCaptured = true;
  }
}

// finding the player's edge tiles 
function isEdgeTile(x, y, gameId) {
  let dirs = [
    {x:1,y:0}, {x: -1, y: 0}, {x: 0, y:1}, {x: 0, y: -1}
  ];
  for (let d of dirs) {
    let nx = x + d.x;
    let ny = y + d.y;
    if (nx < 0 || nx >= cols || ny >= rows){
      return true;
    }
    if (grid[ny][nx] !== TERRITORY + gameId) {
      return true;
    }
  }
  return false;
}

// decreasing the player's territory randomly if they come into contact with a booster / speedUp
function drainTerritory(gameId, amount = 1){
  if (!partyIsHost()){
    return;
  }
  let edgeTiles = [];
  for (let y = 0; y < rows; y++){
    for (let x = 0; x < cols; x++){
      if (grid[y][x] === TERRITORY + gameId && isEdgeTile(x, y, gameId)){
        edgeTiles.push({x, y});
      }
    }
  }
  if (edgeTiles.length <= 10){
    return;
  }let maxDrain = edgeTiles.length - 10;
  let drainAmount = min(amount, maxDrain);
  for (let i = edgeTiles.length - 1; i > 0; i--) {
    let j = floor(random(i+1));
    [edgeTiles[i], edgeTiles[j]] =[edgeTiles[j], edgeTiles[i]];
  }
  for (let i = 0; i < drainAmount; i ++) {
    let t = edgeTiles[i];
    grid[t.y][t.x] = OPEN_TILE;
  }
}

//
function checkLinekills(player, x1, y1, x2, y2) {
  if (!partyIsHost()){
    return;
  }
  let distance = dist(x1, y1, x2, y2);
  let steps = ceil(distance) / (CELL_SIZE * 0.4);

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
// was intended to allow player's to kill palyer's, but player movement is too fast so it skips over tiles without killing the player
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
  //removing player data
  delete shared.trails[gameId];
  delete hostPlayers[playerId];
  delete shared.players[playerId];
}
//detecting if players have left the grid
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
// randomly spawning powerups throughout grid every 6 seconds
function hostSpawnPowerups() {
  if (!partyIsHost()){
    return;
  }
  if (millis() - lastPowerSpawn < POWER_SPAWN_INTERVAL ) {
    return;
  }
  lastPowerSpawn = millis();
  let attempts = 0;
  let gx, gy;
  do { 
    gx = floor(random(cols));
    gy = floor(random(rows));
    attempts++; 
  }
  while (grid[gy][gx] !== OPEN_TILE && attempts < 200 );
  if (attempts >= 200) {
    return;
  }
  let type = random() < 0.6 ? POWER_BONUS : POWER_TRAP;
  shared.powerups.push ({
    x: gx,
    y: gy, 
    type, 
    born: millis()
  });
}

//removing powerups 
function hostRemovePowerups() {
  if (!partyIsHost()){
    return;
  }
  for (let i = shared.powerups.length -1; i >= 0; i --) {
    let p = shared.powerups[i];
    if (p.claimedBy !== undefined){
      applyPowerup(p.claimedBy, p.type);
      shared.powerups.splice(i, 1);
    }
  }
}
// timer set to 60 seconds
function hostCheckMatchTimer() {
  if (!partyIsHost()){
    return;
  }
  if (!shared.matchStartTime || shared.matchEnded){
    return;
  }
  let elapsed = millis() - shared.matchStartTime;
  if (elapsed >= MATCH_DURATION) {
    shared.matchEnded = true;
    determineWinner();
  }
}
// determines player with the most territory
function determineWinner() {
  let scores = calculateTerritoryScores();
  let bestScore = -1;
  let bestPlayer = null;
  for (let gameId in scores) {
    if (scores[gameId] > bestScore) {
      bestScore = scores[gameId];
      bestPlayer = gameId;
    }
  }
  shared.winner = bestPlayer;
}

//displaying the timer
function drawMatchTimer() {
  if (!shared.matchStartTime) {
    return;
  }
  let remaining = max(0, MATCH_DURATION - (millis() - shared.matchStartTime));
  let seconds = ceil(remaining / 1000);
  push();
  resetMatrix();
  textAlign(CENTER, TOP);
  textSize(28);
  fill(255);
  text(`Time Left: ${seconds}s`, width / 2, 20);
  pop();
}
//displays who won the game after timer runs out
function drawWinnerScreen() {
  background(0);
  push();
  textAlign(CENTER, CENTER);
  textSize(48);
  fill(255);
  let winner = shared.winner;
  text(`Player ${winner} Wins!`, width /2, height / 2 - 40);
  textSize(24);
  text("Game Over", width /2 , height /2 + 20);
  pop();
}

//displaying the powerups on the grid
function drawPowerups() {
  if (!shared.powerups){
    return;
  }
  for (let p of shared.powerups) {
    let px = p.x * CELL_SIZE + CELL_SIZE / 2;
    let py = p.y * CELL_SIZE + CELL_SIZE / 2;
    if (p.type === POWER_BONUS) {
      fill (0, 255, 100);
      drawingContext.shadowBlur = 15;
      drawingContext.shadowColor = "rgba(0, 255, 100, 0.8)";
    }
    noStroke();
    ellipse(px, py, CELL_SIZE * 0.6);
    drawingContext.shadowBlur = 0;
  }

}
//powerups are cleared off screen after 11 seconds
function clearPowerups() {
  if (!partyIsHost()){
    return;
  }
  let now = millis();
  shared.powerups = shared.powerups.filter(p => now - p.born < POWER_LIFETIME);
}

//determining how much territory tiles each player has
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
// checking if player comes into contact with powerup
function checkPowerup(player) {
  if (!shared.powerups) {
    return;
  }
  let {gx, gy} = worldGrid(player.x, player.y);
  for (let i = shared.powerups.length - 1; i >= 0; i--) {
    let p = shared.powerups[i];
    if (p.x === gx && p.y === gy) {
      //Host applies the poewrup
      if(partyIsHost()){
        applyPowerup(player.gameId, p.type);
        shared.powerups.splice(i, 1);
      }
      else {
        //Guest marks that they have claimed the power up
        p.claimedBy = player.gameId;
      }
    }
  }
}
//ensuring powerUp works for the right player
function applyPowerup(gameId, type) {
  if (!partyIsHost()){
    return;
  }
  if (type === POWER_BONUS){
    if (random() < 0.1) {
      growTerritory(gameId, 75, 120);
    }
    else{
      growTerritory(gameId, 25, 75);
    }
    
  }
  else if (type === POWER_TRAP){
    drainTerritory(gameId, 20);
  }
}
// increasing the player's territory when after it comes in contact with a powerup
function growTerritory(gameId, min = 25, max = 75) {
  let added = 0;
  let amount = floor(random(min, max + 1));
  let area = [];

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (grid[y][x] === TERRITORY + gameId) {
        let neighbors = [
          {x: x+1, y: y}, 
          {x: x-1, y: y}, 
          {x: x, y: y+1}, 
          {x: x, y:y -1 } 
        ];
        for (let n of neighbors){
          if( n.x >= 0 && n.x < cols && n.y >= 0 && n.y < rows && grid[n.y][n.x] === OPEN_TILE ){
            area.push(n);
          }
        }
      }
    }
    //increasing player's territory
    for (let i = area.length - 1; i > 0; i --) {
      let j = floor(random(i + 1));
      [area[i], area[j] = area[j], area[i]];
    }
    for ( cell of area) {
      if (added >= amount) {
        break;
      }
      if (grid[cell.y][cell.x] === OPEN_TILE) {
        grid[cell.y][cell.x] = TERRITORY + gameId;
        added++;
      }
    }
  }
}
// updating the leaderboard as player's gain/lose territory
function updateLeaderboard() {
  if (!partyIsHost()){
    return;
  }
  shared.leaderboard = calculateTerritoryScores();
}
//displaying the leaderboard
function drawLeaderboard() {
  if (!shared.leaderboard){
    return;
  }
  push();
  resetMatrix();
  textAlign(LEFT, TOP);
  textSize(20);
  fill(255);
  // Leaderboard sorts by total territory;
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
  //text( `Kills: ${kills}`, width - 20, 20);
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

  //Drawing the big grid onto the miniMap
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
    //drawing players onto the minimaps
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
// filling in territory after players create a closed loop
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
// glow effect when player successfully captures territory
function drawTerritoryFlash(){
  if (!territoryFlashes || territoryFlashes.length === 0){
    return;
  }
  push();
  for (let i = territoryFlashes.length - 1; i >= 0; i --){
    let t = territoryFlashes[i];
    let px = t.x * CELL_SIZE;
    let py = t.y * CELL_SIZE;
    let alpha = map(t.life, 0, 30, 0, 180);
    fill(0, 220, 255, alpha);
    noStroke();
    rect(px, py, CELL_SIZE, CELL_SIZE);
    t.life--;
    if (t.life <= 0) {
      territoryFlashes.splice ( i, 1);
    }
  }
  drawingContext.shadowBlur = 0;
  pop();
}

// drawing a boost meter that animates when player presses shift
function drawBoostMeter(){
  if (!my.player) {
    return;
  }
  let meterWidth = 200;
  let meterHeight = 18;
  let x = width / 2 - meterWidth /2;
  let y = height - 40;
  push();
  resetMatrix();
  fill(40);
  rect(x, y, meterWidth, meterHeight, 10);
  let w = map(my.player.boostEnergy, 0, 100, 0, meterWidth);
  fill(0, 200, 255);
  rect(x, y, w , meterHeight, 10);
  noFill();
  stroke(255);
  rect(x, y, meterWidth, meterHeight, 10);
  fill(255);
  noStroke();
  textAlign(CENTER, CENTER);
  textSize(12);
  text("BOOST", width /2, y - 10);
  pop();
}
// when player leaves territory, a circular trail surrounds them
function drawPlayerGlow(x, y, size, r, g, b) {
  push();
  drawingContext.save();
  noStroke();
  let pulse = sin(millis() * 0.008) * 10 + 30;
  drawingContext.shadowBlur = pulse;
  drawingContext.shadowColor = `rgba(${r}, ${g}, ${b}, 0.9)`;
  fill(r, g, b, 120);
  ellipse(x, y, size * 1.4);
  drawingContext.restore();
  pop();
}
//player movement 
function updatePlayer(){
  my.inputX = horizontalMovement();
  my.inputY = verticalMovement();
  my.inputBoost = boostKey();
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
function boostKey(){
  return keyIsDown(SHIFT);
}