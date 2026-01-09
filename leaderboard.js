
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
}
const previousPlayerRank = (type, userId, position) => {
    let prevPos = position;
    if(prevPos){
        prevPos = position;
    }


}