import { useState, useEffect, useMemo } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { type Deck } from './DeckItem';
import './DeckSelector.css';

interface Player {
  uid: string;
  email: string;
  alias: string;
  irlFirstName: string;
  decks: Deck[];
}

interface DeckSelectorProps {
  onSelect: (deck: Deck) => void;
  onClose: () => void;
  excludeEmail?: string;
}

function DeckSelector({ onSelect, onClose, excludeEmail }: DeckSelectorProps) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [playerSearch, setPlayerSearch] = useState('');
  const [deckSearch, setDeckSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPlayers();
  }, []);

  const loadPlayers = async () => {
    try {
      const usersCollection = collection(db, 'users');
      const querySnapshot = await getDocs(usersCollection);

      const playersData: Player[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (excludeEmail && data.email === excludeEmail) return;

        playersData.push({
          uid: doc.id,
          email: data.email || '',
          alias: data.alias || '',
          irlFirstName: data.irlFirstName || '',
          decks: data.decks || []
        });
      });

      playersData.sort((a, b) => (b.alias || b.irlFirstName).localeCompare(a.alias || a.irlFirstName));
      setPlayers(playersData);
    } catch (error) {
      console.error('Error loading players:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPlayers = useMemo(() => {
    if (!playerSearch.trim()) return players;

    const searchLower = playerSearch.toLowerCase();
    return players.filter(player =>
      player.alias.toLowerCase().includes(searchLower) ||
      player.irlFirstName.toLowerCase().includes(searchLower)
    );
  }, [players, playerSearch]);

  const filteredDecks = useMemo(() => {
    if (!selectedPlayer) return [];
    if (!deckSearch.trim()) return selectedPlayer.decks;

    const searchLower = deckSearch.toLowerCase();
    return selectedPlayer.decks.filter(deck =>
      deck.name.toLowerCase().includes(searchLower)
    );
  }, [selectedPlayer, deckSearch]);

  const handleDeckSelect = (deck: Deck) => {
    onSelect(deck);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content deck-selector-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{selectedPlayer ? `Select Deck - ${selectedPlayer.alias || selectedPlayer.irlFirstName}` : 'Select Player'}</h2>
          <button className="modal-close-btn" onClick={onClose}>✕</button>
        </div>

        {!selectedPlayer ? (
          <>
            <input
              type="text"
              className="deck-selector-search"
              placeholder="Search players..."
              value={playerSearch}
              onChange={(e) => setPlayerSearch(e.target.value)}
              autoFocus
            />

            <div className="deck-selector-list">
              {loading ? (
                <div className="deck-selector-loading">Loading players...</div>
              ) : filteredPlayers.length === 0 ? (
                <div className="no-items-found">No players found</div>
              ) : (
                filteredPlayers.map(player => (
                  <div
                    key={player.uid}
                    className="deck-selector-item"
                    onClick={() => {
                      setSelectedPlayer(player);
                      setPlayerSearch('');
                    }}
                  >
                    <div className="player-name">
                      {player.alias || player.irlFirstName || 'Unknown'}
                    </div>
                    <div className="deck-count">{player.decks.length} decks</div>
                  </div>
                ))
              )}
            </div>
          </>
        ) : (
          <>
            <button
              className="back-to-players-btn"
              onClick={() => {
                setSelectedPlayer(null);
                setDeckSearch('');
              }}
            >
              ← Back to Players
            </button>

            <input
              type="text"
              className="deck-selector-search"
              placeholder="Search decks..."
              value={deckSearch}
              onChange={(e) => setDeckSearch(e.target.value)}
              autoFocus
            />

            <div className="deck-selector-list">
              {filteredDecks.length === 0 ? (
                <div className="no-items-found">
                  {deckSearch ? 'No decks found' : 'This player has no decks'}
                </div>
              ) : (
                filteredDecks.map(deck => (
                  <div
                    key={deck.id}
                    className="deck-selector-item"
                    onClick={() => handleDeckSelect(deck)}
                  >
                    <div className="deck-name">{deck.name}</div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default DeckSelector;
