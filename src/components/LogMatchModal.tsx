import { useState, useEffect } from 'react';
import { collection, addDoc, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import PlayerSelector, { type Player } from './PlayerSelector';
import DeckSelector from './DeckSelector';
import PlayerSection from './PlayerSection';
import { type Deck } from './DeckItem';
import './LogMatchModal.css';

interface LogMatchModalProps {
  onSave: () => void;
  onDiscard: () => void;
}

function LogMatchModal({ onSave, onDiscard }: LogMatchModalProps) {
  const { user } = useAuth();
  const [player1, setPlayer1] = useState<Player | null>(null);
  const [player2, setPlayer2] = useState<Player | null>(null);
  const [player1DeckOwner, setPlayer1DeckOwner] = useState<Player | null>(null);
  const [player2DeckOwner, setPlayer2DeckOwner] = useState<Player | null>(null);
  const [player1Deck, setPlayer1Deck] = useState<Deck | null>(null);
  const [player2Deck, setPlayer2Deck] = useState<Deck | null>(null);
  const [player1Wins, setPlayer1Wins] = useState(0);
  const [player2Wins, setPlayer2Wins] = useState(0);
  const [showPlayerSelector, setShowPlayerSelector] = useState(false);
  const [showPlayer1DeckOwnerSelector, setShowPlayer1DeckOwnerSelector] = useState(false);
  const [showPlayer2DeckOwnerSelector, setShowPlayer2DeckOwnerSelector] = useState(false);
  const [showPlayer1DeckSelector, setShowPlayer1DeckSelector] = useState(false);
  const [showPlayer2DeckSelector, setShowPlayer2DeckSelector] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  useEffect(() => {
    if (user) {
      loadCurrentUser();
    }
  }, [user]);

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

  const loadCurrentUser = async () => {
    if (!user) return;

    try {
      const docRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        setPlayer1({
          uid: user.uid,
          email: data.email || user.email || '',
          alias: data.alias || '',
          irlFirstName: data.irlFirstName || '',
          elo: data.elo ?? 1000
        });
      }
    } catch (error) {
      console.error('Error loading current user:', error);
    }
  };

  const handlePlayerSelect = (player: Player) => {
    setPlayer2(player);
    setPlayer2Deck(null);
    setShowPlayerSelector(false);
  };

  const handlePlayer1DeckOwnerSelect = (player: Player) => {
    setPlayer1DeckOwner(player);
    setPlayer1Deck(null);
    setShowPlayer1DeckOwnerSelector(false);
  };

  const handlePlayer2DeckOwnerSelect = (player: Player) => {
    setPlayer2DeckOwner(player);
    setPlayer2Deck(null);
    setShowPlayer2DeckOwnerSelector(false);
  };

  const handlePlayer1DeckSelect = (deck: Deck) => {
    setPlayer1Deck(deck);
    setShowPlayer1DeckSelector(false);
  };

  const handlePlayer2DeckSelect = (deck: Deck) => {
    setPlayer2Deck(deck);
    setShowPlayer2DeckSelector(false);
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

  const handleSubmitClick = () => {
    if (!player1 || !player2 || !player1Deck || !player2Deck) {
      alert('Please select both players and their decks');
      return;
    }

    if (player1Wins === player2Wins) {
      alert('There must be a winner (one player needs 2 wins)');
      return;
    }

    if (player1Wins !== 2 && player2Wins !== 2) {
      alert('One player must have 2 wins');
      return;
    }

    setShowConfirmation(true);
  };

  const handleConfirmedSubmit = async () => {
    try {
      await addDoc(collection(db, 'unapprovedMatches'), {
        player1Email: player1!.email,
        player1DeckId: player1Deck!.id,
        player1Wins,
        player2Email: player2!.email,
        player2DeckId: player2Deck!.id,
        player2Wins,
        p1Approval: true,
        p2Approval: false,
        timeCreated: new Date().toISOString()
      });

      onSave();
    } catch (error) {
      console.error('Error logging match:', error);
      alert('Failed to log match. Please try again.');
    }
  };

  return (
    <>
      <div className="modal-overlay" onClick={onDiscard}>
        <div className="modal-content log-match-modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2>Log Match</h2>
            <button className="modal-close-btn" onClick={onDiscard}>✕</button>
          </div>

          <div className="match-form">
            <div className="player-section">
              <h3>Player 1 (You)</h3>
              <div className="player-display">
                {player1 ? (
                  <span>{player1.alias || player1.irlFirstName || player1.email}</span>
                ) : (
                  <span className="placeholder">Loading...</span>
                )}
              </div>

              <label>Whose deck did you play with?</label>
              <div
                className="player-display clickable"
                onClick={() => setShowPlayer1DeckOwnerSelector(true)}
              >
                {player1DeckOwner ? (
                  <span>{player1DeckOwner.alias || player1DeckOwner.irlFirstName || player1DeckOwner.email}</span>
                ) : (
                  <span className="placeholder">Select player...</span>
                )}
              </div>

              <label>Deck</label>
              <div
                className="player-display clickable"
                onClick={() => player1DeckOwner && setShowPlayer1DeckSelector(true)}
              >
                {player1Deck ? (
                  <span>{player1Deck.name}</span>
                ) : (
                  <span className="placeholder">Select deck...</span>
                )}
              </div>

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

            <PlayerSection
              title="Player 2"
              player={player2}
              deckOwner={player2DeckOwner}
              selectedDeck={player2Deck}
              wins={player2Wins}
              onDeckOwnerClick={() => setShowPlayer2DeckOwnerSelector(true)}
              onDeckClick={() => setShowPlayer2DeckSelector(true)}
              onWinsChange={handlePlayer2WinsChange}
              showPlayerSelector={true}
              onPlayerClick={() => setShowPlayerSelector(true)}
            />
          </div>

          <div className="modal-actions">
            <button className="modal-discard-btn" onClick={onDiscard}>
              Cancel
            </button>
            <button className="modal-save-btn" onClick={handleSubmitClick}>
              Submit Match
            </button>
          </div>
        </div>
      </div>

      {showPlayerSelector && (
        <PlayerSelector
          onSelect={handlePlayerSelect}
          onClose={() => setShowPlayerSelector(false)}
          excludeEmail={user?.email || undefined}
        />
      )}

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

      {showConfirmation && player2 && (
        <div className="modal-overlay" onClick={() => setShowConfirmation(false)}>
          <div className="modal-content confirmation-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Confirm Match</h2>
            </div>
            <p className="confirmation-message">
              Once <strong>{player2.alias || player2.irlFirstName || 'the other player'}</strong> approves, you will be awarded <strong>{player1Wins > player2Wins ? '3' : '1'} point{player1Wins > player2Wins ? 's' : ''}</strong> for {player1Wins > player2Wins ? 'winning' : 'losing'} and <strong>{player2.alias || player2.irlFirstName || 'they'}</strong> will be awarded <strong>{player1Wins > player2Wins ? '1 point' : '3 points'}</strong> for {player1Wins > player2Wins ? 'losing' : 'winning'}.
            </p>
            <div className="modal-actions">
              <button className="modal-discard-btn" onClick={() => setShowConfirmation(false)}>
                Cancel
              </button>
              <button className="modal-save-btn" onClick={handleConfirmedSubmit}>
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default LogMatchModal;
