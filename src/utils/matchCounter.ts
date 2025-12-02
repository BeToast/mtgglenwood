import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';

export interface MatchCount {
  playerEmail: string;
  matchesLogged: number;
  matchesRemaining: number;
  periodLimit: number;
}

/**
 * Counts matches for a player in a specific period
 * Queries both player1Email and player2Email fields
 */
export async function getPlayerMatchCount(
  playerEmail: string,
  periodId: string,
  periodLimit: number
): Promise<MatchCount> {
  try {
    const matchesRef = collection(db, 'matches');

    // Query for matches where the player is player1
    const q1 = query(
      matchesRef,
      where('periodId', '==', periodId),
      where('player1Email', '==', playerEmail)
    );

    // Query for matches where the player is player2
    const q2 = query(
      matchesRef,
      where('periodId', '==', periodId),
      where('player2Email', '==', playerEmail)
    );

    const [snapshot1, snapshot2] = await Promise.all([
      getDocs(q1),
      getDocs(q2)
    ]);

    const matchesLogged = snapshot1.size + snapshot2.size;
    const matchesRemaining = Math.max(0, periodLimit - matchesLogged);

    return {
      playerEmail,
      matchesLogged,
      matchesRemaining,
      periodLimit
    };
  } catch (error) {
    console.error('Error counting matches:', error);
    // Return safe defaults on error
    return {
      playerEmail,
      matchesLogged: 0,
      matchesRemaining: periodLimit,
      periodLimit
    };
  }
}

/**
 * Batch version for multiple players
 * Fetches match counts for all players in parallel
 */
export async function getMultiplePlayerMatchCounts(
  playerEmails: string[],
  periodId: string,
  periodLimit: number
): Promise<Map<string, MatchCount>> {
  const results = new Map<string, MatchCount>();

  // Fetch all match counts in parallel
  const promises = playerEmails.map(email =>
    getPlayerMatchCount(email, periodId, periodLimit)
  );

  const counts = await Promise.all(promises);

  // Build map of email -> count
  counts.forEach(count => {
    results.set(count.playerEmail, count);
  });

  return results;
}
