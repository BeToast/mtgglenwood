import { useState, useEffect } from 'react';
import { collection, addDoc, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import PlayerSelector, { type Player } from './PlayerSelector';
import DeckSelector from './DeckSelector';
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
  const [player1Deck, setPlayer1Deck] = useState<Deck | null>(null);
  const [player2Deck, setPlayer2Deck] = useState<Deck | null>(null);
  const [player1Decks, setPlayer1Decks] = useState<Deck[]>([]);
  const [player2Decks, setPlayer2Decks] = useState<Deck[]>([]);
  const [player1Wins, setPlayer1Wins] = useState(0);
  const [player2Wins, setPlayer2Wins] = useState(0);
  const [showPlayerSelector, setShowPlayerSelector] = useState(false);
  const [showDeckSelector, setShowDeckSelector] = useState(false);
  const [selectingDeckFor, setSelectingDeckFor] = useState<'player1' | 'player2' | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  useEffect(() => {
    if (user) {
      loadCurrentUser();
    }
  }, [user]);

  useEffect(() => {
    if (player1) {
      loadPlayerDecks(player1.uid, 'player1');
    }
  }, [player1]);

  useEffect(() => {
    if (player2) {
      loadPlayerDecks(player2.uid, 'player2');
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

  const loadPlayerDecks = async (uid: string, playerNum: 'player1' | 'player2') => {
    try {
      const docRef = doc(db, 'users', uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        const decks = data.decks || [];
        if (playerNum === 'player1') {
          setPlayer1Decks(decks);
        } else {
          setPlayer2Decks(decks);
        }
      }
    } catch (error) {
      console.error('Error loading player decks:', error);
    }
  };

  const handlePlayerSelect = (player: Player) => {
    setPlayer2(player);
    setPlayer2Deck(null);
    setShowPlayerSelector(false);
  };

  const handleDeckSelect = (deck: Deck) => {
    if (selectingDeckFor === 'player1') {
      setPlayer1Deck(deck);
    } else {
      setPlayer2Deck(deck);
    }
    setShowDeckSelector(false);
    setSelectingDeckFor(null);
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

              <label>Deck</label>
              {player1Decks.length > 0 ? (
                <select
                  value={player1Deck?.id || ''}
                  onChange={(e) => {
                    const deck = player1Decks.find(d => d.id === e.target.value);
                    setPlayer1Deck(deck || null);
                  }}
                >
                  <option value="">Select deck...</option>
                  {player1Decks.map(deck => (
                    <option key={deck.id} value={deck.id}>{deck.name}</option>
                  ))}
                </select>
              ) : (
                <div className="no-decks-message">You have no decks</div>
              )}
              {!player1Deck && (
                <button
                  className="select-other-deck-btn"
                  onClick={() => {
                    setSelectingDeckFor('player1');
                    setShowDeckSelector(true);
                  }}
                >
                  Select another player's deck
                </button>
              )}

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
              <h3>Player 2</h3>
              <div
                className="player-display clickable"
                onClick={() => setShowPlayerSelector(true)}
              >
                {player2 ? (
                  <span>{player2.alias || player2.irlFirstName || player2.email}</span>
                ) : (
                  <span className="placeholder">Select player...</span>
                )}
              </div>

              <label>Deck</label>
              {player2 && player2Decks.length > 0 ? (
                <select
                  value={player2Deck?.id || ''}
                  onChange={(e) => {
                    const deck = player2Decks.find(d => d.id === e.target.value);
                    setPlayer2Deck(deck || null);
                  }}
                >
                  <option value="">Select deck...</option>
                  {player2Decks.map(deck => (
                    <option key={deck.id} value={deck.id}>{deck.name}</option>
                  ))}
                </select>
              ) : (
                <div className="no-decks-message">
                  {player2 ? 'This player has no decks' : 'Select a player first'}
                </div>
              )}
              {player2 && !player2Deck && (
                <button
                  className="select-other-deck-btn"
                  onClick={() => {
                    setSelectingDeckFor('player2');
                    setShowDeckSelector(true);
                  }}
                >
                  Select another player's deck
                </button>
              )}

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

      {showDeckSelector && (
        <DeckSelector
          onSelect={handleDeckSelect}
          onClose={() => {
            setShowDeckSelector(false);
            setSelectingDeckFor(null);
          }}
          excludeEmail={user?.email || undefined}
        />
      )}

      {showConfirmation && player2 && (
        <div className="modal-overlay" onClick={() => setShowConfirmation(false)}>
          <div className="modal-content confirmation-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Confirm Match</h2>
            </div>
            <p className="confirmation-message">
              Once <strong>{player2.alias || player2.irlFirstName || 'the other player'}</strong> approves, this will appear in match history and affect ELO.
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
