import { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc, deleteDoc, addDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { type Deck } from './DeckItem';
import { calculateElo } from '../utils/eloCalculator';
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
  timeCreated: string;
}

interface MatchApprovalModalProps {
  match: UnapprovedMatch;
  currentUserEmail: string;
  onComplete: () => void;
}

function MatchApprovalModal({ match, currentUserEmail, onComplete }: MatchApprovalModalProps) {
  const [player1Name, setPlayer1Name] = useState('');
  const [player2Name, setPlayer2Name] = useState('');
  const [player1DeckName, setPlayer1DeckName] = useState('');
  const [player2DeckName, setPlayer2DeckName] = useState('');
  const [player1Decks, setPlayer1Decks] = useState<Deck[]>([]);
  const [player2Decks, setPlayer2Decks] = useState<Deck[]>([]);
  const [selectedPlayer1DeckId, setSelectedPlayer1DeckId] = useState(match.player1DeckId);
  const [selectedPlayer2DeckId, setSelectedPlayer2DeckId] = useState(match.player2DeckId);
  const [player1Wins, setPlayer1Wins] = useState(match.player1Wins);
  const [player2Wins, setPlayer2Wins] = useState(match.player2Wins);
  const [hasChanges, setHasChanges] = useState(false);
  const [loading, setLoading] = useState(true);

  const isPlayer1 = currentUserEmail === match.player1Email;

  useEffect(() => {
    loadMatchData();
  }, []);

  useEffect(() => {
    const changed =
      selectedPlayer1DeckId !== match.player1DeckId ||
      selectedPlayer2DeckId !== match.player2DeckId ||
      player1Wins !== match.player1Wins ||
      player2Wins !== match.player2Wins;
    setHasChanges(changed);
  }, [selectedPlayer1DeckId, selectedPlayer2DeckId, player1Wins, player2Wins]);

  const loadMatchData = async () => {
    try {
      const usersCollection = collection(db, 'users');
      const usersSnapshot = await getDocs(usersCollection);

      // Find player 1
      const player1Doc = usersSnapshot.docs.find(d => d.data().email === match.player1Email);
      if (player1Doc) {
        const p1Data = player1Doc.data();
        setPlayer1Name(p1Data.irlFirstName || p1Data.alias || 'Player 1');
        setPlayer1Decks(p1Data.decks || []);
        const deck = (p1Data.decks || []).find((d: Deck) => d.id === match.player1DeckId);
        setPlayer1DeckName(deck?.name || 'Unknown Deck');
      }

      // Find player 2
      const player2Doc = usersSnapshot.docs.find(d => d.data().email === match.player2Email);
      if (player2Doc) {
        const p2Data = player2Doc.data();
        setPlayer2Name(p2Data.irlFirstName || p2Data.alias || 'Player 2');
        setPlayer2Decks(p2Data.decks || []);
        const deck = (p2Data.decks || []).find((d: Deck) => d.id === match.player2DeckId);
        setPlayer2DeckName(deck?.name || 'Unknown Deck');
      }
    } catch (error) {
      console.error('Error loading match data:', error);
    } finally {
      setLoading(false);
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

  const handleDiscard = async () => {
    if (!window.confirm('Poof! This match is gone forever. Are you sure?')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'unapprovedMatches', match.id));
      onComplete();
    } catch (error) {
      console.error('Error deleting match:', error);
      alert('Failed to delete match');
    }
  };

  const handleUpdate = async () => {
    try {
      await updateDoc(doc(db, 'unapprovedMatches', match.id), {
        player1DeckId: selectedPlayer1DeckId,
        player2DeckId: selectedPlayer2DeckId,
        player1Wins,
        player2Wins,
        p1Approval: isPlayer1,
        p2Approval: !isPlayer1
      });

      alert('Match updated. The other player will be prompted to approve the changes.');
      onComplete();
    } catch (error) {
      console.error('Error updating match:', error);
      alert('Failed to update match');
    }
  };

  const handleApprove = async () => {
    if (player1Wins === player2Wins || (player1Wins !== 2 && player2Wins !== 2)) {
      alert('Invalid score. One player must have 2 wins.');
      return;
    }

    try {
      // Get player UIDs and ELOs
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const player1Doc = usersSnapshot.docs.find(d => d.data().email === match.player1Email);
      const player2Doc = usersSnapshot.docs.find(d => d.data().email === match.player2Email);

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
      await updateDoc(doc(db, 'users', player1Doc.id), {
        elo: eloResult.player1NewElo,
        wins: player1Data.wins + (player1IsWinner ? 1 : 0),
        losses: player1Data.losses + (player1IsWinner ? 0 : 1)
      });

      await updateDoc(doc(db, 'users', player2Doc.id), {
        elo: eloResult.player2NewElo,
        wins: player2Data.wins + (player1IsWinner ? 0 : 1),
        losses: player2Data.losses + (player1IsWinner ? 1 : 0)
      });

      // Get deck names
      const p1Deck = (player1Data.decks || []).find((d: Deck) => d.id === selectedPlayer1DeckId);
      const p2Deck = (player2Data.decks || []).find((d: Deck) => d.id === selectedPlayer2DeckId);

      // Create approved match record
      await addDoc(collection(db, 'matches'), {
        player1Email: match.player1Email,
        player1FirstName: player1Data.irlFirstName || player1Data.alias || 'Unknown',
        player1DeckName: p1Deck?.name || 'Unknown Deck',
        player1Wins,
        player1EloChange: eloResult.player1Change,
        player2Email: match.player2Email,
        player2FirstName: player2Data.irlFirstName || player2Data.alias || 'Unknown',
        player2DeckName: p2Deck?.name || 'Unknown Deck',
        player2Wins,
        player2EloChange: eloResult.player2Change,
        timeCreated: match.timeCreated
      });

      // Delete unapproved match
      await deleteDoc(doc(db, 'unapprovedMatches', match.id));

      onComplete();
    } catch (error) {
      console.error('Error approving match:', error);
      alert('Failed to approve match');
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
    <div className="modal-overlay">
      <div className="modal-content match-approval-modal">
        <div className="modal-header">
          <h2>Match Approval</h2>
        </div>

        <div className="approval-form">
          <div className="player-section">
            <h3>{player1Name}</h3>

            <label>Deck</label>
            <select
              value={selectedPlayer1DeckId}
              onChange={(e) => setSelectedPlayer1DeckId(e.target.value)}
            >
              {player1Decks.map(deck => (
                <option key={deck.id} value={deck.id}>{deck.name}</option>
              ))}
            </select>

            <label>Wins</label>
            <div className="wins-checkboxes">
              {[0, 1].map(num => (
                <label key={num} className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={player1Wins >= num + 1}
                    onChange={() => handlePlayer1WinsChange(
                      player1Wins >= num + 1 ? num : num + 1
                    )}
                  />
                  {num + 1}
                </label>
              ))}
            </div>
          </div>

          <div className="player-section">
            <h3>{player2Name}</h3>

            <label>Deck</label>
            <select
              value={selectedPlayer2DeckId}
              onChange={(e) => setSelectedPlayer2DeckId(e.target.value)}
            >
              {player2Decks.map(deck => (
                <option key={deck.id} value={deck.id}>{deck.name}</option>
              ))}
            </select>

            <label>Wins</label>
            <div className="wins-checkboxes">
              {[0, 1].map(num => (
                <label key={num} className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={player2Wins >= num + 1}
                    onChange={() => handlePlayer2WinsChange(
                      player2Wins >= num + 1 ? num : num + 1
                    )}
                  />
                  {num + 1}
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="modal-actions">
          <button className="modal-discard-btn" onClick={handleDiscard}>
            Discard Match
          </button>
          <button
            className="modal-save-btn"
            onClick={hasChanges ? handleUpdate : handleApprove}
          >
            {hasChanges ? 'Update' : 'Approve'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default MatchApprovalModal;
