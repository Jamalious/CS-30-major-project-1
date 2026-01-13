let miniMapWidth = 200;
let miniMapHeight = 150;
let miniMapX;
let miniMapY;


class Minimap {
  constructor(canvas, graph, size){
    this.canvas = canvas;
    this.graph = graph;
    this.size = size;

    canvas.width = size;
    canvas.height = size;
    this.context = canvas.getcontext("2d");
  }
  update(viewPoint){
    const scaler = 0.05;
    const newViewPoint= scale(viewPoint, -scaler);
    this.context.clearRect(0, 0 , this.size, this. size);
    this.context.save();
    this.context.translate(-viewPoint.x, -viewPoint.y);  
    this.context.scale(newViewPoint, scaler);
  }
}

function drawMinimap(px, py, territory){
  push();
  translate(miniMapX, miniMapY);
  fill(0, 100); //shadow effect
  
  //drawing player territory on miniMap
  map(territory.x, 0, windowWidth, miniMapWidth);
  map(territory.y, 0, windowHeight, miniMapHeight);
 
  //drawing player position on miniMap
  map(px, 0, windowWidth, miniMapWidth);
  map(py, 0, windowHeight, miniMapHeight);  
 
  //
  ellipse(playerX, playerY, 5, 5 );
  pop();
}
