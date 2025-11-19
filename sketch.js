// Project Title
// Your Name
// Date
//
// Extra for Experts:
// - describe what you did to take this project "above and beyond"
let shared, guests, my;
let test;

class Player {
  constructor(x, y, id, color, direction, isAlive, trail, base){
    this.x = x;
    this.y = y;
    this.id = id;
    this.color = color;
    this.direction  = direction;
    this.base = base;
    this.trail = trail;
    this.isAlive = isAlive;
    
  }
  
}


function preload(){
  partyConnect("wss://deepstream-server-1.herokuapp.com","grid.io");
  shared = partyLoadShared("shared");
  guests = partyLoadGuestShareds();
  my = partyLoadMyShared();

}
function setup() {
  createCanvas(windowWidth, windowHeight);
  test = new Player(50, 50, Math.floor(random() * 1000000, "green", "right", "true", [], [] ));
  console.log(test);
}

function draw() {
  background(0);
  circle(mouseX, mouseY,50);
}

