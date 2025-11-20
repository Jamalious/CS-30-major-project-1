// Project Title
// Your Name
// Date
//
// Extra for Experts:
// - describe what you did to take this project "above and beyond"
let shared, guests, my;
let test;

class Player {
  constructor(x, y, color, direction, isAlive, trail, base){
    this.x = x;
    this.y = y;
    this.id = Math.floor(Math.random(1000));
    this.color = color;
    this.direction  = direction;
    this.base = base;
    this.trail = trail;
    this.isAlive = isAlive;
    
  }
  update(){
    if(this.isAlive){
    }
  }

  
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
  test = new Player(0,0,0,0,0,0,0,0);
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

