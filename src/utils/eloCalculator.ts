const K_FACTOR = 32;

export interface EloResult {
  player1NewElo: number;
  player2NewElo: number;
  player1Change: number;
  player2Change: number;
}

export function calculateElo(
  player1Elo: number,
  player2Elo: number,
  player1Wins: number,
  player2Wins: number
): EloResult {
  // Determine actual scores (1 for winner, 0 for loser)
  const player1Score = player1Wins > player2Wins ? 1 : 0;
  const player2Score = player2Wins > player1Wins ? 1 : 0;

  // Calculate expected scores
  const expectedPlayer1 = 1 / (1 + Math.pow(10, (player2Elo - player1Elo) / 400));
  const expectedPlayer2 = 1 / (1 + Math.pow(10, (player1Elo - player2Elo) / 400));

  // Calculate new ratings
  const player1Change = Math.round(K_FACTOR * (player1Score - expectedPlayer1));
  const player2Change = Math.round(K_FACTOR * (player2Score - expectedPlayer2));

  return {
    player1NewElo: player1Elo + player1Change,
    player2NewElo: player2Elo + player2Change,
    player1Change,
    player2Change
  };
}
