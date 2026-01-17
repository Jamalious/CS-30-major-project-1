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

