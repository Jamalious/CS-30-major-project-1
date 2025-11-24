// Project Title
// Your Name
// Date
//
// Extra for Experts:
// - describe what you did to take this project "above and beyond"

const SPEED = 2;
const PLAYER_SIZE = 10;
let shared, guests, my;
let test;






function preload(){
  partyConnect("wss://deepstream-server-1.herokuapp.com","grid.io");
  shared = partyLoadShared("shared", {
    playerPerspective: 3,
    
  });
  guests = partyLoadGuestShareds();
  my = partyLoadMyShared();

}

class Player {
  constructor(x, y, dx, dy, color, direction, isAlive, trail, base){
    this.x = x;
    this.y = y;
    this.dx = dx;
    this.dy = dy;
    this.id = Math.floor(Math.random(1000));
    this.color = color;
    this.direction  = direction;
    this.base = base;
    this.trail = trail;
    this.isAlive = true;
    
  }
  update(){
    let i = input();
    if(isAlive){
      dx = lerp(dx, i.x * SPEED, 0.1);
      dy = lerp(dy, i.y * SPEED, 0.1);
      this.x += this.dx;
      this.y += this.dy;
    }
  }
}
function setup() {
  createCanvas(windowWidth, windowHeight);
  my.player = new Player(0,0,0,0,0,0,0);
  console.log("me", JSON.stringify(my));
  console.log("guests", JSON.stringify(guests));

}

function draw() {
  background(0);
  drawPlayers();
  updatePlayer();
}

function mousePressed(){
}
function drawPlayers(){
  for(let g of guests) {
    if(g.player !== my.player){
      rect(g.player.x, g.player.y, 10, 15);
      console.log("playerHasSpawned!");
    }
  }
}

function checkCollisions(playerX, playerY){

}
function updatePlayer(){
  my.player.update();
}

//disc room clone input functions
function moveLeft(){
  return keyIsDown(LEFT_ARROW) || keyIsDown(65) || keyIsDown(74);
}
function moveRight(){
  return keyIsDown(RIGHT_ARROW) || keyIsDown(68) || keyIsDown(76);
}
function moveUp(){
  return keyIsDown(UP_ARROW) || keyIsDown(87) || keyIsDown(73);
}
function moveDown(){
  return keyIsDown(DOWN_ARROW) || keyIsDown(83) || keyIsDown(75);
}
function horizontalMovement(){
  return moveRight() - moveLeft();
}
function verticalMovement(){
  return moveDown() - moveUp();
}
function input(){
  return {x: verticalMovement(), y: verticalMovement()};
}