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
const CELLSIZE = 20;
const PLAYER = 5;
const TERRITORY = 1;
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
let startX = [];
let startY = [];

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
  constructor(x, y, dx, dy, direction,base,){
    this.x = x;
    this.y = y;
    this.dx = dx;
    this.dy = dy;
    this.id = Math.floor(Math.random()* 1000);
    this.color = random(theColor);
    this.direction  = direction;
    this.base = [];
    this.trail = [];
    this.outside = true;
    this.isAlive = false;
    
  }
  update(){
    
    if(this.isAlive){
      let i = input();
      this.dx = lerp(this.dx, i.x * SPEED, 0.1);
      this.dy = lerp(this.dy, i.y * SPEED, 0.1);
      this.x += this.dx;
      this.y += this.dy;
    }
    let v = createVector(this.x, this.y);
    if (this.outside){
      this.trail.push(v); 
      if(this.trail.length > 25){
        this.trail.splice(0, 1);
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
  my.player = new Player(random(windowWidth),random(windowHeight),0,0,0,0,0);
  grid = generateRandomGrid(cols, rows);

  grid[my.player.y][my.player.x] = PLAYER;

  //if (!shared.guests){
  //  shared.players = {};
  //}
  //shared.players[partyId] = {x: playerSprite.x, y:playerSprite.y, color: 'blue'};
  console.log("me", JSON.stringify(my));
  console.log("guests", JSON.stringify(guests));
 
  if (partyIsHost){
    partySetShared(shared, {timer: 0});

  }
  gridOutput(LABEL);

}

function draw() {
  translate(width/2 - my.player.x, height/2 - my.player.y);
  background(0);
  drawHexagonGrid();
  drawPlayers();
  updatePlayer();
  botMovement();
  homeScreenOverlay();
  gameState();
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
  my.player.isAlive = !my.player.isAlive;
  startButton.hide();

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
  for (let y = 0; y < height; y += Y_SPACE) {
    for (let x = 0; x < width; x += X_SPACE) {
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
    if(g.player.isAlive){
    
    }
    vertex(startX - 75, startY - 75);
    vertex(startX- 75, startY + 75);
    vertex(startX + 75, startY + 75);
    vertex(startX+ 75, startY-75);
    endShape(CLOSE);

    image(soccerBrainrot, g.player.x, g.player.y, PLAYER_SIZE, PLAYER_SIZE);

    
    // console.log("playerHasSpawned!");
   
  }
}

function checkCollisions(playerX, playerY, guestX, guestY){
  playerX = my.player.x;
  playerY  = my.player.y;
  guestX = g.player.x;
  guestY  = g.player.y;
}

function gameLeaderboard(){
  for(let g of guests){
    let leaderboard = [];
    leaderboard.push(g.player.area);
    
  }
  for (let i = 0; i < leaderboard.length; i++){
    let entry = leaderboard[i];
    let rank = i + 1;
    let display = 
  }

  let count = leaderboard.length();
  leaderboard = sort(leaderboard, count);

}

function generateTerritory(cols, rows) {
  let newGrid = [];
  for (let y = 0; y < rows; y++) {
    newGrid.push([]);
    for (let x = 0; x < cols; x++) {
      newGrid[y].push(TERRITORY);
    }
  }
  return newGrid;
}

function displayTerritory(cols, rows){
  for (let g of guests){
    for(let y = 0; y < cols; y++){
      for(let x = 0; x < rows; x++){
        if ( grid[y][x] === TERRITORY ){
          rect(g.player.x * CELLSIZE, g.player.y * CELLSIZE, CELLSIZE);
        }
      }
    }
  }
}
function playerMovement(cols, rows){
}

function updatePlayer(){
  my.player.update();
  my.player.territory();
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