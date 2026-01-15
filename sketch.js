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
const STARTING_BASE = 100;
const B_SIZE = 50;
const CELL_SIZE = 20;
const PLAYER = 9;
const TERRITORY = 1;
const EDGE = 8;
const ENEMEY = 9;
const OPEN_TILE = 1;
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


let theColor = ["red", "blue", "green", "orange", "yellow"];

function preload(){
  soccerBrainrot = loadImage("soccer-brainrot.jpg");
  crocoBrainrot = loadImage("crocodile-brainrot.jpg");
  //soccerAni = loadAni("soccer-brainrot.jpg", 1, 8);
  
  
  partyConnect("wss://deepstream-server-1.herokuapp.com","grid.io");
  shared = partyLoadShared("shared", {
    playerPerspective: 3,
    
  });
  guests = partyLoadGuestShareds();
  my = partyLoadMyShared();
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
    this.base = [];
    this.trail = [];
    this.killstreak = 0;
    this.outside = true;
    this.isAlive = false;
    this.killcount = 0;
    
  }
  update(){
    if (this.isAlive){
      let i = input();
      this.dx = lerp(this.dx, i.x * SPEED, 0.1);
      this.dy = lerp(this.dy, i.y * SPEED, 0.1);
      this.x += this.dx;
      this.y += this.dy;
      let v = createVector(this.x, this.y);

      if (this.outside){
        this.trail.push(v); 
        if(this.trail.length > 25){
          this.trail.splice(0, 1);
        }
      }  
    }
  }
  territory(){
    stroke(0);
    noStroke();
    for (let i = 0; i < this.trail.length; i++){
      let pos = this.trail[i];
      rectMode(CENTER);
      square(pos.x , pos.y +25, 20, 20);
    }
    for(let i  = 0; i < this.startY; i++){
    }
  }
  // updating + calculating each players base size
  area(){
    // how to access "area" parameter in gridOutput???
  }
}
function setup() {
  createCanvas(windowWidth, windowHeight);
  imageMode(CENTER);
  cols = Math.floor(width/ CELL_SIZE);
  rows = Math.floor(height / CELL_SIZE);
  let initX = floor(random(1000));
  let initY = floor(random(1000));
  my.player = new Player(initX, initY,0,0,0,0);
  grid = generateGrid(cols, rows);
  if (partyIsHost){
    partySetShared(shared, {timer: 0});
  }
  //put my player on the grid
  //if (!shared.guests){
  //  shared.players = {};
  //}
  //shared.players[partyId] = {x: playerSprite.x, y:playerSprite.y, color: 'blue'};
  console.log("me", JSON.stringify(my));
  console.log("guests", JSON.stringify(guests));
 
 
  //gridOutput(LABEL);
}

function draw() {
  translate(width/2 - my.player.x, height/2 - my.player.y);
  background(0);
  drawHexagonGrid();
  displayGrid();
  drawPlayers();
  updatePlayer();
  botMovement();
  drawMinimap(my.player.x, my.player.y, my.player.territory);
  
}

function botMovement(){
  //move bot 10% of distance to the player every draw call
  //bot.moveTowards(g.player.x, g.player.y, 0.10);
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

function drawPlayers(){
  for(let g of guests) {
    startX = g.player.x;
    startY = g.player.y;
    noStroke();
    beginShape();
    fill(g.player.color);
    vertex(startX - 75, startY - 75);
    vertex(startX- 75, startY + 75);
    vertex(startX + 75, startY + 75);
    vertex(startX+ 75, startY-75);
    endShape(CLOSE);
    image(soccerBrainrot, g.player.x, g.player.y, PLAYER_SIZE, PLAYER_SIZE);
   
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

function displayGrid(cols, rows){
  for (let g of guests){
    for(let y = 0; y < cols; y++){
      for(let x = 0; x < rows; x++){
        if ( grid[y][x] === TERRITORY ){
          rect(g.player.x * CELL_SIZE, g.player.y * CELL_SIZE, CELL_SIZE);
        }
      }
    }
  }
}
function captureTerritory(player){
  for (let t of player.trail) {
    shared.grid[t.y][t.x] = TERRITORY + my.player.id;
    my.player.territory.push({x: t.x, y: t.y});
  }
  player.trail = [];

}
function updatePlayer(){
  my.player.update();
}
function gameLogic(){
  let newX = my.player.x;
  let newY = my.player.y;
  const cell = grid[newX][newY];
  // die if colliding with trail
  if (cell === TRAIL){
    my.player.isAlive = false;
    return;
  }
  for(let g of guests.concat[my]){
    if(g.trail && g.trail.some(t => t.x === newX && t.y === newY)){
      g.player.isAlive = false;
    }
  }
  for (let g of guests) {
    ///if(!g.alive) {
    //  //continue;
    //}
    // Checks if a guest has touched another person's trail
    for (let g of guests.concat([my])) {
      if (g.player.id === g.palyer.id || ! g.player.isAlive) {
        continue;
      }
      for (let t of other.trail) {
        if (g.player.x === t.x && g.player.y === t.player.y) {
          g.player.alive = false;
        }
      }
    }
  }
  const insideOwnTerritory = cell === TERRITORY + my.player.id;
  if(!insideOwnTerritory) {
    //grid[my.player.y][my.player.x] = TRAIL + my.player.id;
    // my.player.trail.push({x: my.player.x, y: my.player.y });
  }
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