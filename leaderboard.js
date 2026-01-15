
//live leaderboard
const createLeaderboardEntry = async (userId, data)  => {
  const {type, score} = data;
  const{item} = {
    userId: userId,
    type: type,
    highscore: score,
    isDead: false,
    joinDate: new Date().toISOString(),
    endDate: new Date().toISOString(),
  };
};

const previousPlayerRank = (type, userId, position) => {
  let prevPos = position;
  if(prevPos){
    prevPos = position;
  }
};

//function gameLeaderboard(){
// // for(let g of guests){
//  // let leaderboard = [];
// // leaderboard.push(g.player.area);
    
// }
//for (let i = 0; i < leaderboard.length; i++){
// // let entry = leaderboard[i];
//  // let rank = i + 1;
// // let display = rank + "." + entry.name + ":" + entry.score; 
// // text(display, LDB_POS, startY + i * spacing);
// // }

// // let count = leaderboard.length();
// // leaderboard = sort(leaderboard, count);

//}