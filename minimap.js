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
