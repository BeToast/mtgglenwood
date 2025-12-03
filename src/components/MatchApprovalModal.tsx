import { useState, useEffect } from 'react';
import { doc, updateDoc, deleteDoc, addDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { type Deck } from './DeckItem';
import { calculateElo } from '../utils/eloCalculator';
import PlayerSelector, { type Player } from './PlayerSelector';
import DeckSelector from './DeckSelector';
import PlayerSection from './PlayerSection';
import { getAllPeriods, getCurrentPeriod } from '../utils/periodCalculator';
import { type MatchCount, getPlayerMatchCount } from '../utils/matchCounter';
import './MatchApprovalModal.css';

interface UnapprovedMatch {
  id: string;
  player1Email: string;
  player1DeckId: string;
  player1Wins: number;
  player2Email: string;
  player2DeckId: string;
  player2Wins: number;
  p1Approval: boolean;
  p2Approval: boolean;
  periodId?: string;
  timeCreated: string;
}

interface MatchApprovalModalProps {
  match: UnapprovedMatch;
  currentUserEmail: string;
  onComplete: () => void;
}

function MatchApprovalModal({ match, currentUserEmail, onComplete }: MatchApprovalModalProps) {
  const [player1, setPlayer1] = useState<Player | null>(null);
  const [player2, setPlayer2] = useState<Player | null>(null);
  const [player1DeckOwner, setPlayer1DeckOwner] = useState<Player | null>(null);
  const [player2DeckOwner, setPlayer2DeckOwner] = useState<Player | null>(null);
  const [selectedPlayer1Deck, setSelectedPlayer1Deck] = useState<Deck | null>(null);
  const [selectedPlayer2Deck, setSelectedPlayer2Deck] = useState<Deck | null>(null);
  const [player1Wins, setPlayer1Wins] = useState(match.player1Wins);
  const [player2Wins, setPlayer2Wins] = useState(match.player2Wins);
  const [hasChanges, setHasChanges] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showPlayer1DeckOwnerSelector, setShowPlayer1DeckOwnerSelector] = useState(false);
  const [showPlayer2DeckOwnerSelector, setShowPlayer2DeckOwnerSelector] = useState(false);
  const [showPlayer1DeckSelector, setShowPlayer1DeckSelector] = useState(false);
  const [showPlayer2DeckSelector, setShowPlayer2DeckSelector] = useState(false);
  const [currentUserMatchCount, setCurrentUserMatchCount] = useState<MatchCount | null>(null);

  const isPlayer1 = currentUserEmail === match.player1Email;

  useEffect(() => {
    loadMatchData();
    loadCurrentUserMatchCount();
  }, []);

  useEffect(() => {
    if (player1) {
      setPlayer1DeckOwner(player1);
    }
  }, [player1]);

  useEffect(() => {
    if (player2) {
      setPlayer2DeckOwner(player2);
    }
  }, [player2]);

  useEffect(() => {
    const changed =
      selectedPlayer1Deck?.id !== match.player1DeckId ||
      selectedPlayer2Deck?.id !== match.player2DeckId ||
      player1Wins !== match.player1Wins ||
      player2Wins !== match.player2Wins;
    setHasChanges(changed);
  }, [selectedPlayer1Deck, selectedPlayer2Deck, player1Wins, player2Wins]);

  const loadMatchData = async () => {
    try {
      const usersCollection = collection(db, 'users');
      const usersSnapshot = await getDocs(usersCollection);

      // Find player 1
      const player1Doc = usersSnapshot.docs.find(d => d.data().email === match.player1Email);
      if (player1Doc) {
        const p1Data = player1Doc.data();
        const p1: Player = {
          uid: player1Doc.id,
          email: p1Data.email || '',
          alias: p1Data.alias || '',
          irlFirstName: p1Data.irlFirstName || '',
          elo: p1Data.elo ?? 1000
        };
        setPlayer1(p1);

        // Find and set the initial deck
        const decks = p1Data.decks || [];
        const initialDeck = decks.find((d: Deck) => d.id === match.player1DeckId);
        if (initialDeck) {
          setSelectedPlayer1Deck(initialDeck);
        }
      }

      // Find player 2
      const player2Doc = usersSnapshot.docs.find(d => d.data().email === match.player2Email);
      if (player2Doc) {
        const p2Data = player2Doc.data();
        const p2: Player = {
          uid: player2Doc.id,
          email: p2Data.email || '',
          alias: p2Data.alias || '',
          irlFirstName: p2Data.irlFirstName || '',
          elo: p2Data.elo ?? 1000
        };
        setPlayer2(p2);

        // Find and set the initial deck
        const decks = p2Data.decks || [];
        const initialDeck = decks.find((d: Deck) => d.id === match.player2DeckId);
        if (initialDeck) {
          setSelectedPlayer2Deck(initialDeck);
        }
      }
    } catch (error) {
      console.error('Error loading match data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCurrentUserMatchCount = async () => {
    try {
      const periods = await getAllPeriods();
      if (periods.length === 0) return;

      const currentPeriod = getCurrentPeriod(periods);
      if (!currentPeriod) return;

      const count = await getPlayerMatchCount(currentUserEmail, currentPeriod.id, currentPeriod.matchesPerPlayer);
      setCurrentUserMatchCount(count);
    } catch (error) {
      console.error('Error loading current user match count:', error);
    }
  };

  const handlePlayer1WinsChange = (wins: number) => {
    setPlayer1Wins(wins);
    if (wins === 2) {
      setPlayer2Wins(Math.min(player2Wins, 1));
    }
  };

  const handlePlayer2WinsChange = (wins: number) => {
    setPlayer2Wins(wins);
    if (wins === 2) {
      setPlayer1Wins(Math.min(player1Wins, 1));
    }
  };

  const handlePlayer1DeckOwnerSelect = (player: Player) => {
    setPlayer1DeckOwner(player);
    setSelectedPlayer1Deck(null);
    setShowPlayer1DeckOwnerSelector(false);
  };

  const handlePlayer2DeckOwnerSelect = (player: Player) => {
    setPlayer2DeckOwner(player);
    setSelectedPlayer2Deck(null);
    setShowPlayer2DeckOwnerSelector(false);
  };

  const handlePlayer1DeckSelect = (deck: Deck) => {
    setSelectedPlayer1Deck(deck);
    setShowPlayer1DeckSelector(false);
  };

  const handlePlayer2DeckSelect = (deck: Deck) => {
    setSelectedPlayer2Deck(deck);
    setShowPlayer2DeckSelector(false);
  };

  const handleDiscard = async () => {
    if (!window.confirm('Poof! This match is gone forever. Are you sure?')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'unapprovedMatches', match.id));
      onComplete();
    } catch (error) {
      console.error('Error deleting match:', error);
      let errorMessage = 'Failed to delete match';

      if (error instanceof Error) {
        if (error.message.includes('permission-denied')) {
          errorMessage = 'Permission denied. Make sure you\'re logged in properly.';
        } else if (error.message.includes('unauthenticated')) {
          errorMessage = 'Authentication failed. Please refresh and log in again.';
        } else {
          errorMessage = `Error: ${error.message}`;
        }
      }

      alert(errorMessage);
    }
  };

  const handleUpdate = async () => {
    if (!selectedPlayer1Deck || !selectedPlayer2Deck) {
      alert('Please select decks for both players');
      return;
    }

    try {
      await updateDoc(doc(db, 'unapprovedMatches', match.id), {
        player1DeckId: selectedPlayer1Deck.id,
        player2DeckId: selectedPlayer2Deck.id,
        player1Wins,
        player2Wins,
        p1Approval: isPlayer1,
        p2Approval: !isPlayer1
      });

      alert('Match updated. The other player will be prompted to approve the changes.');
      onComplete();
    } catch (error) {
      console.error('Error updating match:', error);
      let errorMessage = 'Failed to update match';

      if (error instanceof Error) {
        if (error.message.includes('permission-denied')) {
          errorMessage = 'Permission denied. Make sure you\'re logged in properly.';
        } else if (error.message.includes('unauthenticated')) {
          errorMessage = 'Authentication failed. Please refresh and log in again.';
        } else {
          errorMessage = `Error: ${error.message}`;
        }
      }

      alert(errorMessage);
    }
  };

  const handleApprove = async () => {
    if (player1Wins === player2Wins || (player1Wins !== 2 && player2Wins !== 2)) {
      alert('Invalid score. One player must have 2 wins.');
      return;
    }

    if (!selectedPlayer1Deck || !selectedPlayer2Deck || !player1 || !player2) {
      alert('Please select decks for both players');
      return;
    }

    try {
      // Validate period limits before approving
      const periods = await getAllPeriods();
      const currentPeriod = getCurrentPeriod(periods);

      if (currentPeriod) {
        const player1Count = await getPlayerMatchCount(player1.email, currentPeriod.id, currentPeriod.matchesPerPlayer);
        const player2Count = await getPlayerMatchCount(player2.email, currentPeriod.id, currentPeriod.matchesPerPlayer);

        if (player1Count.matchesRemaining === 0) {
          alert(`${player1.alias || player1.irlFirstName} has reached their match limit for this period`);
          return;
        }

        if (player2Count.matchesRemaining === 0) {
          alert(`${player2.alias || player2.irlFirstName} has reached their match limit for this period`);
          return;
        }
      }
      // Get player data for elo and stats
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const player1Doc = usersSnapshot.docs.find(d => d.id === player1.uid);
      const player2Doc = usersSnapshot.docs.find(d => d.id === player2.uid);

      if (!player1Doc || !player2Doc) {
        throw new Error('Players not found');
      }

      const player1Data = player1Doc.data();
      const player2Data = player2Doc.data();

      const player1CurrentElo = player1Data.elo ?? 1000;
      const player2CurrentElo = player2Data.elo ?? 1000;

      // Calculate ELO changes
      const eloResult = calculateElo(
        player1CurrentElo,
        player2CurrentElo,
        player1Wins,
        player2Wins
      );

      // Update player stats
      const player1IsWinner = player1Wins > player2Wins;
      await updateDoc(doc(db, 'users', player1.uid), {
        elo: eloResult.player1NewElo,
        wins: player1Data.wins + (player1IsWinner ? 1 : 0),
        losses: player1Data.losses + (player1IsWinner ? 0 : 1),
        points: (player1Data.points ?? 0) + (player1IsWinner ? 3 : 1)
      });

      await updateDoc(doc(db, 'users', player2.uid), {
        elo: eloResult.player2NewElo,
        wins: player2Data.wins + (player1IsWinner ? 0 : 1),
        losses: player2Data.losses + (player1IsWinner ? 1 : 0),
        points: (player2Data.points ?? 0) + (player1IsWinner ? 1 : 3)
      });

      // Create approved match record
      await addDoc(collection(db, 'matches'), {
        player1Email: match.player1Email,
        player1FirstName: player1.alias || player1.irlFirstName || 'Unknown',
        player1DeckName: selectedPlayer1Deck.name || 'Unknown Deck',
        player1DeckUrl: selectedPlayer1Deck.decklistUrl || '',
        player1Wins,
        player1EloChange: eloResult.player1Change,
        player2Email: match.player2Email,
        player2FirstName: player2.alias || player2.irlFirstName || 'Unknown',
        player2DeckName: selectedPlayer2Deck.name || 'Unknown Deck',
        player2DeckUrl: selectedPlayer2Deck.decklistUrl || '',
        player2Wins,
        player2EloChange: eloResult.player2Change,
        periodId: match.periodId || '',
        timeCreated: match.timeCreated
      });

      // Delete unapproved match
      await deleteDoc(doc(db, 'unapprovedMatches', match.id));

      onComplete();
    } catch (error) {
      console.error('Error approving match:', error);
      let errorMessage = 'Failed to approve match';

      if (error instanceof Error) {
        if (error.message.includes('permission-denied')) {
          errorMessage = 'Permission denied. Make sure you\'re logged in properly.';
        } else if (error.message.includes('not-found')) {
          errorMessage = 'Player data not found. Please try logging out and back in.';
        } else if (error.message.includes('unauthenticated')) {
          errorMessage = 'Authentication failed. Please refresh and log in again.';
        } else if (error.message.includes('Players not found')) {
          errorMessage = 'One or both players could not be found.';
        } else {
          errorMessage = `Error: ${error.message}`;
        }
      }

      alert(errorMessage);
    }
  };

  if (loading) {
    return (
      <div className="modal-overlay">
        <div className="modal-content match-approval-modal">
          <div className="approval-loading">Loading match...</div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="modal-overlay">
        <div className="modal-content match-approval-modal">
          <div className="modal-header">
            <h2>Match Approval</h2>
          </div>

        <div className="approval-form">
          <PlayerSection
            title={player1 ? (player1.alias || player1.irlFirstName || player1.email) : 'Player 1'}
            player={player1}
            deckOwner={player1DeckOwner}
            selectedDeck={selectedPlayer1Deck}
            wins={player1Wins}
            onDeckOwnerClick={() => setShowPlayer1DeckOwnerSelector(true)}
            onDeckClick={() => setShowPlayer1DeckSelector(true)}
            onWinsChange={handlePlayer1WinsChange}
          />

          <PlayerSection
            title={player2 ? (player2.alias || player2.irlFirstName || player2.email) : 'Player 2'}
            player={player2}
            deckOwner={player2DeckOwner}
            selectedDeck={selectedPlayer2Deck}
            wins={player2Wins}
            onDeckOwnerClick={() => setShowPlayer2DeckOwnerSelector(true)}
            onDeckClick={() => setShowPlayer2DeckSelector(true)}
            onWinsChange={handlePlayer2WinsChange}
          />
        </div>

        <div className="modal-actions">
          <button className="modal-discard-btn" onClick={handleDiscard}>
            Discard Match
          </button>
          <button
            className="modal-save-btn"
            onClick={hasChanges ? handleUpdate : handleApprove}
            disabled={!hasChanges && currentUserMatchCount ? currentUserMatchCount.matchesLogged >= currentUserMatchCount.periodLimit : false}
          >
            {hasChanges
              ? 'Update'
              : currentUserMatchCount
                ? `Approve Match ${currentUserMatchCount.matchesLogged + 1}/${currentUserMatchCount.periodLimit}?`
                : 'Approve'}
          </button>
        </div>
      </div>
    </div>

    {showPlayer1DeckOwnerSelector && (
      <PlayerSelector
        onSelect={handlePlayer1DeckOwnerSelect}
        onClose={() => setShowPlayer1DeckOwnerSelector(false)}
      />
    )}

    {showPlayer2DeckOwnerSelector && (
      <PlayerSelector
        onSelect={handlePlayer2DeckOwnerSelect}
        onClose={() => setShowPlayer2DeckOwnerSelector(false)}
      />
    )}

    {showPlayer1DeckSelector && player1DeckOwner && (
      <DeckSelector
        onSelect={handlePlayer1DeckSelect}
        onClose={() => setShowPlayer1DeckSelector(false)}
        ownerId={player1DeckOwner.uid}
      />
    )}

    {showPlayer2DeckSelector && player2DeckOwner && (
      <DeckSelector
        onSelect={handlePlayer2DeckSelect}
        onClose={() => setShowPlayer2DeckSelector(false)}
        ownerId={player2DeckOwner.uid}
      />
    )}
    </>
  );
}

export default MatchApprovalModal;
