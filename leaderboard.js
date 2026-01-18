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