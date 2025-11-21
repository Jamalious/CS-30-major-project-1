// Project Title
// Your Name
// Date
//
// Extra for Experts:
// - describe what you did to take this project "above and beyond"

const SPEED = 2;
let shared, guests, my;
let test;


class Player {
  constructor(x, y, color, direction, isAlive, trail, base){
    this.x = x;
    this.y = y;
    this.dx = dx;
    this.dy = dy;
    this.id = Math.floor(Math.random(1000));
    this.color = color;
    this.direction  = direction;
    this.base = base;
    this.trail = trail;
    this.isAlive = isAlive;
    
  }
  update(){
    my.pos.dx = lerp(my.pos.dx, i.x * SPEED, 0.2);
    my.pos.dy = lerp(my.pos.dy, i.y * SPEED, 0.2);
    my.pos.x += my.pos.dx;
    my.pos.y += my.pos.dy;
    playerIsDead();

  }

  
}

function checkCollisions(playerX, playerY){

}

function preload(){
  partyConnect("wss://deepstream-server-1.herokuapp.com","grid.io");
  shared = partyLoadShared("shared", {
    playerPerspective: 3,
    
  });
  guests = partyLoadGuestShareds();
  my = partyLoadMyShared();

}
function setup() {
  createCanvas(windowWidth, windowHeight);
  my.player = new Player(0,0,0,0,0,0,0);
  console.log(test);
}

function draw() {
  background(0);
  circle(mouseX, mouseY,50);
}

function drawPlayers(){
  for(let g of guests) {
    if(g.player !== my.player){
      push();
      drawNewPlayer(g.player.x, g.player.y, g.player.color, g.player.direction, g.player.isAlive, g.player.trail, g.player.base);
      pop();
    }
  }
}
function drawNewPlayer(x, y, id, color, direction, isAlive, trail, base){
  if (isAlive){
  }

}
function updatePlayer() {
  my.player.update();
}
function movePlayer() {
  if (my.isAlive){
    my.pos.dx = lerp(my.pos.dx, i.x * SPEED);
  }
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
  return {x: verticalMovement(), y: verticalMovement};
}